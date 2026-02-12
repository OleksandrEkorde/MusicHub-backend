import requireAuth from '../middleware/requireAuth.js'
import db from '../db/drizzle.js'
import { subscriptions } from '../db/schema.js'

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get all subscription plans
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       name: { type: string }
 *                       price: { type: integer }
 *                       currency: { type: string }
 *                       features: { type: object }
 *                       description: { type: string }
 *       500:
 *         description: Internal Server Error
 */
export default class SubscriptionController {
  static middleware = requireAuth

  static async getAll(req, res) {
    try {
      const plans = await db.select().from(subscriptions)
      return res.json({ status: 'success', data: plans })
    } catch (error) {
      console.error('Error getting subscriptions:', error)
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' })
    }
  }

  /**
   * @swagger
   * /subscriptions/{id}:
   *   get:
   *     summary: Get subscription plan by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *         description: Subscription ID
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Subscription plan details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status: { type: string, example: "success" }
   *                 data:
   *                   type: object
   *                   properties:
   *                     id: { type: integer }
   *                     name: { type: string }
   *                     price: { type: integer }
   *                     currency: { type: string }
   *                     features: { type: object }
   *                     description: { type: string }
   *       400:
   *         description: Invalid ID
   *       404:
   *         description: Not found
   *       500:
   *         description: Internal Server Error
   */
  static async getById(req, res) {
    try {
      const id = Number.parseInt(req.params.id, 10)
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ status: 'error', message: 'Invalid id' })
      }

      const { eq } = await import('drizzle-orm')
      const plan = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1)

      if (plan.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Not found' })
      }

      return res.json({ status: 'success', data: plan[0] })
    } catch (error) {
      console.error('Error getting subscription:', error)
      return res.status(500).json({ status: 'error', message: 'Internal Server Error' })
    }
  }

  static async purchase(req, res) {
    return res.json({ status: 'success', message: 'Subscription purchased' })
  }
}

async function getSubscription(req, res) {
  try {
    const userId = req.user.id;
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    return res.json({ status: 'success', subscription: subscription[0] });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}