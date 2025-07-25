import userSignup from './auth/user signup.js';
import verifyEmail from './auth/verify email.js';
import userLogin from './auth/user login.js';
import resendEmail from './auth/resendEmail.js';
import redisPing from '../config/plugin/Redisping.js'

export default async function (fastify, opts) {
    fastify.register(userSignup);
    fastify.register(verifyEmail);
    fastify.register(userLogin);
    fastify.register(resendEmail);
    fastify.register(redisPing);
}