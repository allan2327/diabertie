export default {
  onText: {
    positiveTokens: 'yes,y,yep,yay,yo,please',
    negativeTokens: 'no,n,nein,nope,don\'t',
    negativeAnswer: 'Ok, I\'m not doing anything!',
    notUnderstood:  'Oh sorry, I didn\'t get that..'
  },
  generalErrors: {
    userNotFound: 'Oops! I was not able to find a user. Please sign up at diabertie.com first and connect from there',
    superWrong:   'Oops, sorry! Something went completely wrong.. Please try again later'
  },
  bertieConnect: {
    alreadyConnected: 'Sorry, you are already connected with the account `%{email}`',
    success:          'Hey %{name}, I connected you with your diabertie account `%{email}` Glad to have you on board! To start logging values, just write something like:\n\n`190 mg 2 bolus 27 basal 12:30`',
    readyToGo:        'Hey, your account `%{email}` is already connected. Just go ahead and log some values!'
  },
  bertieDetect: {
    errors: {
      notFound: 'Sorry, I didn\'t get that! To log values, please write something like:\n\n`190 mg 2 bolus 27 basal 12:30`'
    },
    warnings: {
      ambiguousSugar:  'Oh, that\'s strange.. I found more than one sugar value:\n\n📈 %{valueTexts}',
      dateWithoutTime: 'Oh, that\'s strange.. I found a date (`%{date}`) without time. That means I would use the current time when saving'
    },
    saveConfirmation: '%{data}\n\nDo you want me to save that?'
  },
  executeLatestChatAction: {
    nothingToDo: 'Sorry, I just don\'t know what to do'
  },
  latestChatActions: {
    saveLogEvents: {
      success: 'Cool, I saved your data'
    }
  }
};
