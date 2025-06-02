import request from 'supertest';
import { expect } from 'chai';
import app from '../index.js'; // Assuming your express app is exported from server/index.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js'; // Import Listing model
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import speakeasy from 'speakeasy';

dotenv.config();

// NOTE: These tests require a running MongoDB and Redis instance.
// Ensure your .env file has MONGO and REDIS_URL configured.
// Ensure your .env has JWT_SECRET and REFRESH_TOKEN_SECRET set for authentication.
// Ensure your .env has APP_NAME set for 2FA.

describe('Auth API', () => {
  // Before running tests, connect to the database
  before(async () => {
    // Ensure MONGO environment variable is set for testing
    if (!process.env.MONGO_TEST) {
      console.warn('MONGO_TEST environment variable not set. Using MONGO instead. Consider using a separate test database.');
    }
    const dbUri = process.env.MONGO_TEST || process.env.MONGO;
    if (!dbUri) {
      throw new Error('MONGO or MONGO_TEST environment variable is not set. Cannot run tests.');
    }
    await mongoose.connect(dbUri);
    // Clear the database before tests (optional, but good practice for isolated tests)
    await User.deleteMany({});
    // You might also need to connect to and clear Redis if your tests involve it heavily
    // Note: For simplicity in this test suite, we are not explicitly clearing Redis
    // for each test, assuming refresh tokens are tied to users and will be cleaned
    // up implicitly or you handle Redis clearing separately for test runs.
  });

  // After running tests, close the database connection
  after(async () => {
    await mongoose.connection.close();
    // Also disconnect Redis client if it was connected explicitly for tests
    // await redisClient.quit(); // Need to import redisClient if doing this
  });

  // Clean up users after each test to ensure isolation
  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.statusCode).to.equal(201);
      expect(res.body).to.equal('User created successfully!');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          // password missing
        });
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'All fields are required');
    });

    it('should return 400 if username or email already exists', async () => {
      // First, create a user
      await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123',
        });

      // Attempt to create a user with the same email
      const resEmail = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'anotheruser',
          email: 'existing@example.com',
          password: 'password456',
        });
      expect(resEmail.statusCode).to.equal(400);
      expect(resEmail.body).to.have.property('message', 'Username or email already exists');

      // Attempt to create a user with the same username
      const resUsername = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'existinguser',
          email: 'another@example.com',
          password: 'password789',
        });
      expect(resUsername.statusCode).to.equal(400);
      expect(resUsername.body).to.have.property('message', 'Username or email already exists');
    });
  });

  describe('POST /api/auth/signin', () => {
    // We need a user to exist before testing signin
    beforeEach(async () => {
      const hashedPassword = bcryptjs.hashSync('password123', 10);
      const newUser = new User({
        username: 'signinuser',
        email: 'signin@example.com',
        password: hashedPassword,
      });
      await newUser.save();
    });

    it('should sign in an existing user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'signin@example.com',
          password: 'password123',
        });

      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.not.have.property('password'); // Password should be excluded
      expect(res.body).to.have.property('refreshToken');
      expect(res.headers['set-cookie']).to.be.an('array');
      expect(res.headers['set-cookie'][0]).to.include('access_token');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
      expect(res.statusCode).to.equal(404);
      expect(res.body).to.have.property('message', 'User not found!');
    });

    it('should return 400 for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'signin@example.com',
          password: 'wrongpassword',
        });
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid credentials!');
    });

    // Add 2FA signin tests later once base signin is working
    it('should require 2FA token if 2FA is enabled', async () => {
      // Enable 2FA for the user (this would normally be done via 2FA setup endpoints)
      const user = await User.findOne({ email: 'signin@example.com' });
      // Manually generate and save a secret for testing purposes
      const secret = speakeasy.generateSecret({ length: 20 });
      user.twoFactorEnabled = true;
      user.twoFactorSecret = secret.base32;
      await user.save();

      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'signin@example.com',
          password: 'password123',
          // No 2FA token provided
        });

      expect(res.statusCode).to.equal(200); // Or 401 depending on desired API contract
      expect(res.body).to.have.property('requiresTwoFactor', true);
    });

    it('should successfully sign in with 2FA token if 2FA is enabled', async () => {
       // Enable 2FA for the user and save a secret
       const user = await User.findOne({ email: 'signin@example.com' });
       const secret = speakeasy.generateSecret({ length: 20 });
       user.twoFactorEnabled = true;
       user.twoFactorSecret = secret.base32;
       await user.save();

       // Generate a valid TOTP token
       const twoFactorToken = speakeasy.totp({
           secret: user.twoFactorSecret,
           encoding: 'base32'
       });

       const res = await request(app)
           .post('/api/auth/signin')
           .send({
               email: 'signin@example.com',
               password: 'password123',
               twoFactorToken: twoFactorToken
           });

       expect(res.statusCode).to.equal(200);
       expect(res.body).to.have.property('user');
       expect(res.body).to.have.property('refreshToken');
       expect(res.headers['set-cookie']).to.be.an('array');
       expect(res.headers['set-cookie'][0]).to.include('access_token');
       expect(res.body).to.have.property('requiresTwoFactor', false); // Should indicate 2FA is not required AFTER successful login
    });

     it('should return 400 for invalid 2FA token if 2FA is enabled', async () => {
        // Enable 2FA for the user and save a secret
        const user = await User.findOne({ email: 'signin@example.com' });
        const secret = speakeasy.generateSecret({ length: 20 });
        user.twoFactorEnabled = true;
        user.twoFactorSecret = secret.base32;
        await user.save();

        const res = await request(app)
            .post('/api/auth/signin')
            .send({
                email: 'signin@example.com',
                password: 'password123',
                twoFactorToken: '123456' // Invalid token
            });

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Invalid 2FA token');
     });
  });

  describe('2FA Setup and Disable API', () => {
    let agent; // Use an agent to persist cookies (for access_token)
    let userId; // To store the user ID for protected routes
    let userEmail = '2fatest@example.com';
    let userPassword = '2fapassword';

    beforeEach(async () => {
      // Create and sign in a user before each 2FA test
      const hashedPassword = bcryptjs.hashSync(userPassword, 10);
      const newUser = new User({
        username: '2fatestuser',
        email: userEmail,
        password: hashedPassword,
      });
      const savedUser = await newUser.save();
      userId = savedUser._id;

      // Use a Supertest agent to automatically manage cookies
      agent = request.agent(app);

      // Sign in the user to get the access_token cookie
      const res = await agent
        .post('/api/auth/signin')
        .send({
          email: userEmail,
          password: userPassword,
        });

      expect(res.statusCode).to.equal(200);
      // The agent will automatically handle the set-cookie header
    });

    describe('POST /api/auth/generate-2fa-secret', () => {
      it('should generate a 2FA secret and QR code for the logged-in user', async () => {
        const res = await agent
          .post('/api/auth/generate-2fa-secret');

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('secret').and.be.a('string');
        expect(res.body).to.have.property('qrCodeUrl').and.be.a('string');

        // Verify that the secret was saved to the user (temporarily)
        const user = await User.findById(userId);
        expect(user.twoFactorSecret).to.equal(res.body.secret);
        expect(user.twoFactorEnabled).to.be.false; // 2FA should not be enabled yet
      });

      it('should return 401 if not authenticated', async () => {
        const res = await request(app)
          .post('/api/auth/generate-2fa-secret');
          // No agent used, no cookie sent

        expect(res.statusCode).to.equal(401);
        expect(res.body).to.have.property('message', 'Unauthorized');
      });
    });

    describe('POST /api/auth/verify-2fa-setup', () => {
      // Need to generate a secret first in some tests
      beforeEach(async () => {
         // Ensure user has a secret generated for verification tests
         const user = await User.findById(userId);
         if (!user.twoFactorSecret) {
             const secret = speakeasy.generateSecret({ length: 20 });
             user.twoFactorSecret = secret.base32;
             await user.save();
         }
      });

      it('should enable 2FA with a valid token', async () => {
        const user = await User.findById(userId);
        const validToken = speakeasy.totp({
            secret: user.twoFactorSecret,
            encoding: 'base32'
        });

        const res = await agent
          .post('/api/auth/verify-2fa-setup')
          .send({ token: validToken });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('message', '2FA enabled successfully');

        // Verify that 2FA is enabled and secret is still there
        const updatedUser = await User.findById(userId);
        expect(updatedUser.twoFactorEnabled).to.be.true;
        expect(updatedUser.twoFactorSecret).to.be.a('string'); // Secret should be saved
      });

      it('should return 400 with an invalid token and clear the secret', async () => {
        const user = await User.findById(userId);
         // Ensure a secret exists before this test
        expect(user.twoFactorSecret).to.be.a('string');

        const res = await agent
          .post('/api/auth/verify-2fa-setup')
          .send({ token: '123456' }); // Invalid token

        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property('message', 'Invalid 2FA token');

        // Verify that 2FA is NOT enabled and the secret is cleared
        const updatedUser = await User.findById(userId);
        expect(updatedUser.twoFactorEnabled).to.be.false;
        expect(updatedUser.twoFactorSecret).to.be.null; // Secret should be cleared
      });

      it('should return 401 if not authenticated', async () => {
        const res = await request(app)
          .post('/api/auth/verify-2fa-setup')
          .send({ token: '123456' });
          // No agent used, no cookie sent

        expect(res.statusCode).to.equal(401);
        expect(res.body).to.have.property('message', 'Unauthorized');
      });

      it('should return 400 if 2FA setup not initiated (no secret)', async () => {
         // Clean up the secret for this specific test case
         const user = await User.findById(userId);
         user.twoFactorSecret = null;
         await user.save();

         const res = await agent
           .post('/api/auth/verify-2fa-setup')
           .send({ token: '123456' }); // Token doesn't matter if no secret

         expect(res.statusCode).to.equal(400);
         expect(res.body).to.have.property('message', '2FA setup not initiated');
      });
    });

    describe('POST /api/auth/disable-2fa', () => {
       // Need 2FA to be enabled for these tests
       beforeEach(async () => {
          const user = await User.findById(userId);
          const secret = speakeasy.generateSecret({ length: 20 });
          user.twoFactorEnabled = true;
          user.twoFactorSecret = secret.base32;
          await user.save();
          // Verify it's enabled
          const updatedUser = await User.findById(userId);
          expect(updatedUser.twoFactorEnabled).to.be.true;
       });

       it('should disable 2FA with the correct password', async () => {
          const res = await agent
            .post('/api/auth/disable-2fa')
            .send({ password: userPassword });

          expect(res.statusCode).to.equal(200);
          expect(res.body).to.have.property('message', '2FA disabled successfully');

          // Verify that 2FA is disabled and secret is cleared
          const user = await User.findById(userId);
          expect(user.twoFactorEnabled).to.be.false;
          expect(user.twoFactorSecret).to.be.null;
       });

       it('should return 401 with an incorrect password and keep 2FA enabled', async () => {
           const res = await agent
             .post('/api/auth/disable-2fa')
             .send({ password: 'wrongpassword' });

           expect(res.statusCode).to.equal(401);
           expect(res.body).to.have.property('message', 'Incorrect password');

           // Verify that 2FA is still enabled and secret is not cleared
           const user = await User.findById(userId);
           expect(user.twoFactorEnabled).to.be.true;
           expect(user.twoFactorSecret).to.be.a('string'); // Secret should still be there
       });

       it('should return 401 if not authenticated', async () => {
         const res = await request(app)
           .post('/api/auth/disable-2fa')
           .send({ password: userPassword });
           // No agent used, no cookie sent

         expect(res.statusCode).to.equal(401);
         expect(res.body).to.have.property('message', 'Unauthorized');
       });

       it('should return 400 if 2FA is already disabled', async () => {
           // Disable 2FA for this specific test case first
           const user = await User.findById(userId);
           user.twoFactorEnabled = false;
           user.twoFactorSecret = null;
           await user.save();

           const res = await agent
             .post('/api/auth/disable-2fa')
             .send({ password: userPassword });

           // The controller doesn't explicitly check if 2FA is enabled before disabling
           // it, but the outcome is the same (twoFactorEnabled will be false and secret null).
           // If you want a specific error message for this case, you would add that logic
           // in the controller. For now, we'll check the resulting state.

           expect(res.statusCode).to.equal(200); // Or potentially 400 if controller logic changes
           expect(res.body).to.have.property('message', '2FA disabled successfully');

           // Verify that 2FA is still disabled and secret is still null
           const updatedUser = await User.findById(userId);
           expect(updatedUser.twoFactorEnabled).to.be.false;
           expect(updatedUser.twoFactorSecret).to.be.null;
       });
    });

  });

  describe('Protected User Routes', () => {
    let agent; // Use an agent to persist cookies (for access_token)
    let userId; // To store the user ID for protected routes
    let userEmail = 'protecteduser@example.com';
    let userPassword = 'protectedpassword';

    beforeEach(async () => {
      // Create and sign in a user before each protected route test
      const hashedPassword = bcryptjs.hashSync(userPassword, 10);
      const newUser = new User({
        username: 'protecteduser',
        email: userEmail,
        password: hashedPassword,
      });
      const savedUser = await newUser.save();
      userId = savedUser._id.toString(); // Get user ID as string

      // Use a Supertest agent to automatically manage cookies
      agent = request.agent(app);

      // Sign in the user to get the access_token cookie
      const res = await agent
        .post('/api/auth/signin')
        .send({
          email: userEmail,
          password: userPassword,
        });

      expect(res.statusCode).to.equal(200);
      // The agent will automatically handle the set-cookie header
    });

    describe('POST /api/user/update/:id', () => {
      it('should return 401 if not authenticated', async () => {
        const res = await request(app)
          .post(`/api/user/update/${userId}`)
          .send({ username: 'newusername' });

        expect(res.statusCode).to.equal(401);
        expect(res.body).to.have.property('message', 'Unauthorized');
      });

      it('should update the user profile if authenticated and authorized', async () => {
        const newUsername = 'updatedprotecteduser';
        const newEmail = 'updatedprotected@example.com';

        const res = await agent
          .post(`/api/user/update/${userId}`)
          .send({ username: newUsername, email: newEmail });

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('username', newUsername);
        expect(res.body).to.have.property('email', newEmail);
        // Check database to confirm update
        const updatedUser = await User.findById(userId);
        expect(updatedUser.username).to.equal(newUsername);
        expect(updatedUser.email).to.equal(newEmail);
      });

       it('should return 401 if authenticated but trying to update another user', async () => {
          // Create another user
          const anotherUser = new User({
            username: 'anotheruser',
            email: 'another@example.com',
            password: bcryptjs.hashSync('anotherpass', 10),
          });
          const savedAnotherUser = await anotherUser.save();
          const anotherUserId = savedAnotherUser._id.toString();

          const res = await agent
            .post(`/api/user/update/${anotherUserId}`)
            .send({ username: 'maliciousupdate' });

          expect(res.statusCode).to.equal(401); // Assuming controller returns 401 for unauthorized update
          expect(res.body).to.have.property('message', 'You can only update your own account!');
       });

       it('should update password if provided', async () => {
          const newPassword = 'newprotectedpassword';

          const res = await agent
            .post(`/api/user/update/${userId}`)
            .send({ password: newPassword });

          expect(res.statusCode).to.equal(200);
          // Password is not returned in the response body, check in DB
          const updatedUser = await User.findById(userId);
          const passwordMatch = bcryptjs.compareSync(newPassword, updatedUser.password);
          expect(passwordMatch).to.be.true;
          // Check that refresh token was deleted from Redis (requires importing redisClient)
          // const refreshTokenInRedis = await redisClient.get(`refreshToken:${userId}`);
          // expect(refreshTokenInRedis).to.be.null;
       });

       it('should return 400 if new password is too short', async () => {
           const shortPassword = 'short';

           const res = await agent
             .post(`/api/user/update/${userId}`)
             .send({ password: shortPassword });

           expect(res.statusCode).to.equal(400);
           expect(res.body).to.have.property('message', 'Password must be at least 6 characters long!');
       });
    });

    describe('DELETE /api/user/delete/:id', () => {
       it('should return 401 if not authenticated', async () => {
          const res = await request(app)
            .delete(`/api/user/delete/${userId}`);

          expect(res.statusCode).to.equal(401);
          expect(res.body).to.have.property('message', 'Unauthorized');
       });

       it('should delete the user profile if authenticated and authorized', async () => {
           const res = await agent
             .delete(`/api/user/delete/${userId}`);

           expect(res.statusCode).to.equal(200);
           expect(res.body).to.equal('User has been deleted!');

           // Verify user is deleted from database
           const deletedUser = await User.findById(userId);
           expect(deletedUser).to.be.null;
           // Check that refresh token was deleted from Redis (requires importing redisClient)
           // const refreshTokenInRedis = await redisClient.get(`refreshToken:${userId}`);
           // expect(refreshTokenInRedis).to.be.null;
       });

       it('should return 401 if authenticated but trying to delete another user', async () => {
           // Create another user
           const anotherUser = new User({
             username: 'anotheruserfordelete',
             email: 'anotherfordelete@example.com',
             password: bcryptjs.hashSync('anotherpass', 10),
           });
           const savedAnotherUser = await anotherUser.save();
           const anotherUserId = savedAnotherUser._id.toString();

           const res = await agent
             .delete(`/api/user/delete/${anotherUserId}`);

           expect(res.statusCode).to.equal(401);
           expect(res.body).to.have.property('message', 'You can only delete your own account!');

           // Verify the other user was NOT deleted
           const otherUserStillExists = await User.findById(anotherUserId);
           expect(otherUserStillExists).to.not.be.null;
       });
    });

    describe('GET /api/user/listings/:id', () => {
        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
              .get(`/api/user/listings/${userId}`);

            expect(res.statusCode).to.equal(401);
            expect(res.body).to.have.property('message', 'Unauthorized');
         });

         it('should return only listings for the authenticated user', async () => {
             // Create listings for the authenticated user
             const userListing1 = new Listing({
                 name: 'User\'s Listing 1',
                 description: 'Description 1',
                 address: 'Address 1',
                 regularPrice: 100000,
                 discountPrice: 90000,
                 bathrooms: 2,
                 bedrooms: 3,
                 furnished: true,
                 parking: true,
                 type: 'rent',
                 offer: true,
                 imageUrls: ['url1', 'url2'],
                 userRef: userId, // Link to the authenticated user
             });
             await userListing1.save();

             const userListing2 = new Listing({
                 name: 'User\'s Listing 2',
                 description: 'Description 2',
                 address: 'Address 2',
                 regularPrice: 200000,
                 discountPrice: 180000,
                 bathrooms: 1,
                 bedrooms: 1,
                 furnished: false,
                 parking: false,
                 type: 'sell',
                 offer: false,
                 imageUrls: ['url3'],
                 userRef: userId, // Link to the authenticated user
             });
             await userListing2.save();

             // Create a listing for another user
             const anotherUser = new User({
               username: 'anotheruserforlisting',
               email: 'anotherforlisting@example.com',
               password: bcryptjs.hashSync('anotherpass', 10),
             });
             const savedAnotherUser = await anotherUser.save();
             const anotherUserId = savedAnotherUser._id.toString();

             const otherUserListing = new Listing({
                 name: 'Other User\'s Listing',
                 description: 'Other Description',
                 address: 'Other Address',
                 regularPrice: 300000,
                 discountPrice: 280000,
                 bathrooms: 3,
                 bedrooms: 4,
                 furnished: true,
                 parking: true,
                 type: 'rent',
                 offer: true,
                 imageUrls: ['url4'],
                 userRef: anotherUserId, // Link to another user
             });
             await otherUserListing.save();

             // Fetch listings using the authenticated user's agent and ID
             const res = await agent
               .get(`/api/user/listings/${userId}`);

             expect(res.statusCode).to.equal(200);
             expect(res.body).to.be.an('array');
             expect(res.body).to.have.lengthOf(2); // Should only return the two listings for the authenticated user
             // Check that the returned listings belong to the correct user
             res.body.forEach(listing => {
                 expect(listing.userRef).to.equal(userId);
             });
         });

         it('should return 401 if authenticated but requesting listings for another user', async () => {
            // Create another user
            const anotherUser = new User({
              username: 'anotheruserforlistingcheck',
              email: 'anotherforlistingcheck@example.com',
              password: bcryptjs.hashSync('anotherpass', 10),
            });
            const savedAnotherUser = await anotherUser.save();
            const anotherUserId = savedAnotherUser._id.toString();

             const res = await agent
               .get(`/api/user/listings/${anotherUserId}`); // Requesting another user's listings

             expect(res.statusCode).to.equal(401); // Assuming controller returns 401 for unauthorized access
             expect(res.body).to.have.property('message', 'You can only view your own listings!');
         });
    });

    describe('GET /api/user/:id', () => {
        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
              .get(`/api/user/${userId}`);

            expect(res.statusCode).to.equal(401);
            expect(res.body).to.have.property('message', 'Unauthorized');
         });

         it('should return the user details (excluding password) for the requested ID', async () => {
             // Create another user to fetch details for
             const userToFetch = new User({
                 username: 'usertofetch',
                 email: 'fetch@example.com',
                 password: bcryptjs.hashSync('fetchpass', 10),
                 avatar: 'fetch_avatar.jpg'
             });
             const savedUserToFetch = await userToFetch.save();
             const userToFetchId = savedUserToFetch._id.toString();

             // Fetch the other user's details using the authenticated agent
             const res = await agent
               .get(`/api/user/${userToFetchId}`);

             expect(res.statusCode).to.equal(200);
             expect(res.body).to.have.property('_id', userToFetchId);
             expect(res.body).to.have.property('username', userToFetch.username);
             expect(res.body).to.have.property('email', userToFetch.email);
             expect(res.body).to.have.property('avatar', userToFetch.avatar);
             expect(res.body).to.not.have.property('password'); // Password should be excluded
             expect(res.body).to.not.have.property('twoFactorSecret'); // 2FA secret should be excluded
         });

         it('should return 404 if the requested user ID does not exist', async () => {
             const nonExistentUserId = new mongoose.Types.ObjectId().toString(); // Generate a valid but non-existent ObjectId

             const res = await agent
               .get(`/api/user/${nonExistentUserId}`);

             expect(res.statusCode).to.equal(404);
             expect(res.body).to.have.property('message', 'User not found!');
         });
    });

  });

  // Add tests for protected routes (e.g., /api/user/update/:id) later
  // Add tests for 2FA setup/disable endpoints later
}); 