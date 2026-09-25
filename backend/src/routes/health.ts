import { FastifyInstance } from 'fastify';
import { prisma } from '../services/db.js';
import { verifyEmailExistence } from '../services/emailVerification.js';
import { sendContactNotification } from '../services/emailSender.js';

export async function runHealthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'JBSnap Backend Template is connected and running!',
    };
  });

  fastify.get('/public-stats', async (request, reply) => {
    try {
      const totalProjects = await prisma.project.count();
      const totalWorkflows = await prisma.workflow.count();
      const totalRequests = await prisma.executionLog.count();
      
      const avgLatencyResult = await prisma.executionLog.aggregate({
        _avg: {
          latencyMs: true
        }
      });
      const avgLatency = Math.round(avgLatencyResult._avg.latencyMs || 0);

      return {
        status: 'success',
        totalProjects,
        totalWorkflows,
        totalRequests,
        avgLatency,
      };
    } catch (err: any) {
      fastify.log.error(err);
      return {
        status: 'error',
        message: err.message,
        totalProjects: 0,
        totalWorkflows: 0,
        totalRequests: 0,
        avgLatency: 0,
      };
    }
  });

  // Public Contact Form Submission Endpoint (Verified email existence + Nodemailer dispatch to dualithjbsnap@gmail.com)
  fastify.post('/contact', async (request, reply) => {
    const { name, email, subject, message } = request.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!email || !message) {
      return reply.status(400).send({
        error: 'Bad Request: email and message are required fields',
      });
    }

    // 1. Perform Deep Email Existence & MX DNS Lookup Verification
    const verification = await verifyEmailExistence(email);
    if (!verification.valid) {
      return reply.status(400).send({
        error: 'Invalid Email Address',
        message: verification.reason || 'The email address provided does not exist or cannot receive mail.',
      });
    }

    const targetEmail = 'dualithjbsnap@gmail.com';

    // 2. Dispatch real email notification via Nodemailer
    const emailResult = await sendContactNotification({
      name: name || 'Website Visitor',
      email: email.trim(),
      subject: subject || 'JBSnap Support Inquiry',
      message: message.trim(),
    });

    return reply.status(200).send({
      success: true,
      routedTo: targetEmail,
      emailDispatched: emailResult.success,
      message: `Your message has been verified and sent directly to ${targetEmail}. Our team will reply to ${email} shortly.`,
    });
  });
}
