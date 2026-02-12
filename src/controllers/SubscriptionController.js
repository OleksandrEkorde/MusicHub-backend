import requireAuth from '../middleware/requireAuth.js'

export default class SubscriptionController {
  static middleware = requireAuth

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