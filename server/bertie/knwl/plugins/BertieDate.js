import moment from 'moment';

export default function BertieTime(knwlInstance) {
  this.calls = function() {
    const words = knwlInstance.words.get('linkWords');
    let results = [];

    words.forEach((word) => {
      const dotFormat = /(\d+)\.(\d+)(\.(\d+))?/;
      const lineFormat = /(\d+)(\-|\/)(\d+)((\-|\/)(\d+))?/;
      let datum;

      if (dotFormat.test(word)) { datum = moment(word, 'DD-MM-YYYY'); }
      else if (lineFormat.test(word)) { datum = moment(word, 'MM-DD-YYYY'); }

      if (!datum) return;

      const date = datum.get('date');
      const month = datum.get('month');
      const year = datum.get('year');

      return results.push({ value: `${date}.${month + 1}.${year}`, date, month, year });
    });

    return results;
  };
}
