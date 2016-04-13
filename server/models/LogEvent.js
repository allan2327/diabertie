import mongoose, { Schema } from 'mongoose';

const LogEventSchema = new Schema({
  category:      String,
  unit:          String,
  value:         Number,
  originalUnit:  String,
  originalValue: Number,
  user:          { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt:     { type: Date, default: Date.now },
});

LogEventSchema.static('groupInInterval', async function(datum, user, interval=5, callback) {
  const start = datum.clone().tz(user.timezone).startOf('day');
  const end = datum.clone().tz(user.timezone).endOf('day');

  const match = {
    createdAt: {
      $gt: start.toDate(),
      $lt: end.toDate()
    },
    user: mongoose.Types.ObjectId(user.id)
  };

  const group = {
    _id: {
      minute: {
        $subtract: [{ $minute: '$createdAt' }, { $mod: [{ $minute: '$createdAt' }, interval]} ]
      },
      hour: { $hour: '$createdAt'}
    },
    logEvents: { '$push': '$$ROOT' }
  };

  const sort = { createdAt: -1 };

  return await this.aggregate([
    { $match: match },
    { $sort: sort },
    { $group: group },
  ]).exec(callback);
});

export default mongoose.model('LogEvent', LogEventSchema);
