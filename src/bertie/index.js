import { bertieStart, } from './actions';
import { detectLogEvents } from './actions/parsing';
import { fetchLogEvents, saveLogEvents, fetchUser } from './actions/database';
import { getDiaryNavigation } from './actions/callback';

import polyglot from './polyglot';
import moment from 'moment-timezone';

export default (bot) => {
  const defaultOpts = { parse_mode: 'Markdown'};
  const sendMessage = (fromId, msg, opts = defaultOpts) => bot.sendMessage(fromId, msg, { ... opts });

  bot.onText(/\/start.*$/, async ({ from }) => {
    const p = polyglot();
    const text = await bertieStart(from);

    sendMessage(from.id, p.t(...text));
  });

  bot.onText(/\/diary/, async ({ from }) => {
    const { user, error: userError } = await fetchUser(from);
    if (userError) { return sendMessage(from.id, polyglot().t(...userError)); }
    const p = polyglot(user.locale);
    const today = moment.utc().tz(user.timezone);

    const { message, error } = await fetchLogEvents(user, today);
    if (error) { return sendMessage(from.id, p.t(...error)); };

    const prevDay = today.clone().subtract(1, 'days').format('YYYY-MM-DD');

    sendMessage(from.id, message, {
      ... defaultOpts,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '<<', callback_data: JSON.stringify({ type: 'navigateDiary', data: { date: prevDay } }) },
          ]
        ]
      }
    });
  });

  bot.onText(/\/deletion/, async ({ from }) => {
    const { user, error: userError } = await fetchUser(from);
    if (userError) { return sendMessage(from.id, polyglot().t(...userError)); }
    const p = polyglot(user.locale);

    // This is a 'feature toggle', remove it when deletion works
    return sendMessage(from.id, p.t('onText.notUnderstood'));

    const today = moment.utc().tz(user.timezone);
    const prevDay = today.clone().subtract(1, 'days').format('YYYY-MM-DD');

    const { message, error } = await fetchLogEvents(user, today);
    if (error) { return sendMessage(from.id, p.t(...error)); };

    const text = `${p.t('deletion.selectDate')}${message}`;

    sendMessage(from.id, text, {
      ... defaultOpts,
      reply_markup: {
        inline_keyboard: [
          [ { text: '<<', callback_data: JSON.stringify({ type: 'deletion', data: { date: prevDay } }) } ],
          [ { text: p.t('deletion.select'), callback_data: JSON.stringify({ type: 'deletion', data: { date: today.format('YYYY-MM-DD'), selected: true } })} ]
        ]
      }
    });
  });

  bot.onText(/^(?!\/)\D*$/, async ({ from }) => {
    const { user, error: userError } = await fetchUser(from);
    if (userError) { return sendMessage(from.id, polyglot().t(...userError)); }

    const p = polyglot(user.locale);
    sendMessage(from.id, p.t('onText.notUnderstood'));
  });

  bot.onText(/^(?!\/).*\d.*\s.*[A-Za-z].*$/, async ({ from, text }) => {
    const { user, error: userError } = await fetchUser(from);
    if (userError) { return sendMessage(from.id, polyglot().t(...userError)); }

    const p = polyglot(user.locale);

    const { error: detectionError, message, warnings, data } = await detectLogEvents(text, p);
    if (detectionError) return sendMessage(from.id, p.t(...detectionError));

    for(let i = 0; i < warnings.length; i++) {
      const warning = warnings[i];
      await sendMessage(from.id, p.t(...warning));
    }

    const detectedAt = moment().format();
    await user.update({ latestDetectedData: { detectedAt, data } });

    sendMessage(from.id, p.t(...message), {
      ... defaultOpts,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Yes', callback_data: JSON.stringify({ type: 'saveLogEvents', data: detectedAt })},
            { text: 'No', callback_data: JSON.stringify({ type: 'saveLogEvents' })}
          ]
        ]
      }
    });
  });

  bot.on('callback_query', async ({ from, data, message: msg }) => {
    const { user, error: userError } = await fetchUser(from);
    if (userError) { return sendMessage(from.id, polyglot().t(...userError)); }
    const p = polyglot(user.locale);
    const callbackProps = JSON.parse(data);
    let newMsg;
    let newButtons;

    switch (callbackProps.type) {
      case 'saveLogEvents': {
        if (!callbackProps.data) {
          newMsg = `${msg.text}\n\n${p.t('saveLogEvents.abort')}`;
        } else if (callbackProps.data != user.latestDetectedData.detectedAt){
          newMsg = `${msg.text}\n\n${p.t('saveLogEvents.oldData')}`;
        } else {
          const { message, error } = await saveLogEvents(user.latestDetectedData.data, user);
          if (error) return newMsg = error;
          newMsg = `${msg.text}\n\n${p.t(...message)}`;
        }
        break;
      }

      case 'navigateDiary': {
        const queriedDate = moment.utc(callbackProps.data.date).tz(user.timezone);
        if (!queriedDate.isValid()) { return sendMessage(from.id, p.t('generalErrors.superWrong')); };

        const { buttons } = getDiaryNavigation('navigateDiary', queriedDate, user, p);
        const { message, error } = await fetchLogEvents(user, queriedDate);
        if (error) { return sendMessage(from.id, p.t(...error)); }

        newMsg = message;
        newButtons = [ buttons ];
        break;
      }

      case 'deletion': {
        const queriedDate = moment.utc(callbackProps.data.date).tz(user.timezone);
        if (!queriedDate.isValid()) { return sendMessage(from.id, p.t('generalErrors.superWrong')); };

        if(!callbackProps.data.selected) {
          const { buttons } = getDiaryNavigation('deletion', queriedDate, user, p);
          const { message, error } = await fetchLogEvents(user, queriedDate);
          if (error) { return sendMessage(from.id, p.t(...error)); }

          newMsg = `${p.t('deletion.selectDate')}${message}`;
          newButtons = [ buttons , [ { text: p.t('deletion.select'), callback_data: JSON.stringify({ type: 'deletion', data: { date: queriedDate.format('YYYY-MM-DD'), selected: true } })} ] ];
        } else {
          newMsg = 'Selected';
        };

        break;
      }
    }

    const messageOptions = {
      ...defaultOpts,
      chat_id:    msg.chat.id,
      message_id: msg.message_id,
    };

    if (newButtons) {
      messageOptions.reply_markup = { inline_keyboard: newButtons };
    }

    bot.editMessageText(newMsg, messageOptions);
  });
};
