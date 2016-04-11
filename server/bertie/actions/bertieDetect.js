import knwl from '../knwl';
import unitsBy from '../knwl/units';

const previewTexts = (events) => events.map(e => `\`${e.value} ${e.subType || e.type}\``).join(', ');

function validateDetections({ time, date, values }) {
  const { sugar, therapy, food } = values;
  const allValues = [... sugar, ... therapy, ... food];
  const errors = [];
  const warnings = [];

  if (allValues.length == 0) { errors.push('Sorry, I didn\'t get that! To track values, please write something like:\n\n`190 mg 2 bolus 27 basal 12:30`'); };
  if (sugar.length > 1) { warnings.push(`Oops, that's strange.. I found more than one \`sugar\` value:\n\n${previewTexts(sugar)}`); }
  if (!time && date) { warnings.push(`Oops, that's strange.. I found a \`date (${date.value})\` but no \`time\`. That means I would use the current time when saving`); }

  return { errors, warnings };
}

export default (text) => {
  return new Promise((resolve) => {
    const parser = knwl(text);
    const types = ['sugar', 'food', 'therapy'];

    const detectedValues = types.reduce((prev, type) => {
      prev[type] = parser.get('bertieValues', unitsBy(type));
      return prev;
    }, {});

    const detections = {
      values: detectedValues,
      time:   parser.get('bertieTimes')[0],
      date:   parser.get('bertieDates')[0]
    };

    const { errors, warnings } = validateDetections(detections);
    if (errors.length) return resolve({ errors });

    const detectionsMsg = types.filter(type => !!detectedValues[type].length)
      .map((type) => `${previewTexts(detectedValues[type])}`)
      .join('\n');

    const messages = [detectionsMsg, `Do you want me to save that? (y/n)`];

    return resolve({ data: detections, messages, warnings });
  });
};