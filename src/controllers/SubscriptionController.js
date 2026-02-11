import requireAuth from '../middleware/requireAuth.js'

export default class SubscriptionController {
  static middleware = requireAuth

  static async purchase(req, res) {
    return res.json({ status: 'success', message: 'Subscription purchased' })
  }
}
