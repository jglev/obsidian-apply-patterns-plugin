import { parseDateRange, ruleDateRegexString } from 'ParseDateRange';

export const validateRuleString = (
    ruleString: string,
    validateRegex: boolean = true,
): { valid: boolean | null; string: string } => {
    const dateMatches = [
        ...ruleString.matchAll(new RegExp(ruleDateRegexString, 'g')),
    ];
    let updatedRuleString = ruleString
        // Because the plugin's settings are stored in JSON, characters like
        // \n get double-escaped, and then do not get replaced automatically
        // on use. This was causing To strings not to parse \n, etc.
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r');
    // Iterate over dateMatches backwards, in order to be able to make changes
    // to updatedRuleString in-place without affecting index numbers from
    // ruleString:
    dateMatches.reverse();
    for (const dateMatch of dateMatches) {
        if (dateMatch.index !== undefined) {
            try {
                const parsedDateRange = parseDateRange(dateMatch[0]);
                if (parsedDateRange === undefined) {
                    return { valid: false, string: '' };
                }
                updatedRuleString =
                    updatedRuleString.substring(0, dateMatch.index) +
                    (parsedDateRange || '') +
                    updatedRuleString.substring(
                        dateMatch.index + dateMatch[0].length,
                    );
            } catch (e) {
                return {
                    valid: false,
                    string: `Error processing date "${dateMatch[0]}": "${e}"`,
                };
            }
        }
    }
    if (validateRegex === false) {
        return { valid: null, string: updatedRuleString };
    }

    try {
        new RegExp(updatedRuleString, 'u');
        return { valid: true, string: updatedRuleString };
    } catch (e) {
        return {
            valid: false,
            string: `(Invalid regular expression) "${updatedRuleString}": "${e}"`,
        };
    }
};
