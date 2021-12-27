import * as chrono from 'chrono-node';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export const ruleDateRegexString =
	/* Match the following formats:
      '{{date:today|tomorrow|YYYY-MM}}'
      '{{date:today|tomorrow}}'
      '{{date:today||YYYY-MM}}'
      '{{date:today||YYYY-MM|\|}}'
      '{{date:tomorrow}}'
      '{{date}}'
    */
	// Note that the curly brackets are escaped here because this regex pattern
	// is meant to be used with 'u' / full Unicode support mode flag set:
	'\\{\\{date(?::(.*?)(?:(?:\\|(.*?)(?:\\|(.*?)(?:\\|(.*?))?)?)?)?)?\\}\\}';

export const parseDateRange = (
	// E.g., '{{date:last month on the 7th|today|YYYY-MM-DD}}'
	dateString: string,
) => {
	const parsedSearchString = dateString.match(
		new RegExp(ruleDateRegexString, 'u'),
	);

	if (parsedSearchString === null) {
		return;
	}

	const dateFormat = parsedSearchString[3] || 'YYYY-MM-DD';
	const joinWith = parsedSearchString[4] || '|';
	// This was previously wrapped in a try/catch block, but is no longer, in
	// order to allow the calling function to handle errors.
	const usedStartString =
		parsedSearchString[1] !== undefined ? parsedSearchString[1] : 'today';
	const start = dayjs(chrono.parseDate(usedStartString));
	let end = null;

	if (!start.isValid()) {
		throw `Start date string "${usedStartString}" did not evaluate to a valid date.`;
	}

	if (
		parsedSearchString[2] !== undefined &&
		parsedSearchString[2] !== null &&
		parsedSearchString[2] !== ''
	) {
		end = dayjs(chrono.parseDate(parsedSearchString[2]));

		if (!end.isValid()) {
			throw `End date string "${parsedSearchString[2]}" did not evaluate to a valid date.`;
		}
	} else {
		return start.format(dateFormat);
	}

	// Get dates between start and end:
	const datesBetween = [];

	for (
		let d = dayjs(start);
		d.isBefore(end.add(1, 'minute'));
		d = d.add(1, 'day')
	) {
		datesBetween.push(dayjs(d).format(dateFormat));
	}

	return datesBetween.join(joinWith);
};

export default parseDateRange;
