import { Notice } from 'obsidian';

import {
	Command,
	Pattern,
	PatternRule,
	formatUnnamedPattern,
	getSettings,
} from './Settings';

export const filterPatterns = (command?: Command): number[] => {
    const patterns = getSettings().patterns;

    let patternIndexes: number[] = getSettings()
        .patterns
		.map((pattern: Pattern, patternIndex: number) => {
			return {pattern, patternIndex}
		})
		.filter(
            (p: {pattern: Pattern, patternIndex: number}) => 
                p.pattern.rules.length > 0 &&
                p.pattern.rules.every((rule: PatternRule) => rule.from !== '')
        )
        .map((p: {pattern: Pattern, patternIndex: number}) => p.patternIndex );

    if (command !== undefined && command.patternFilter !== '') {
        try {
            const patternNameFilterRegex = new RegExp(command.patternFilter);

            patternIndexes = patternIndexes.filter((patternIndex: number) => {
                const pattern: Pattern = patterns[patternIndex];

                if (
                    patternNameFilterRegex.test(
                        pattern.name || formatUnnamedPattern(patternIndex),
                    ) === true
                ) {
                    return true;
                }
                return false;
            });
        } catch (e) {
            new Notice(
                `Error using pattern filter "${command.patternFilter}" pattern settings from clipboard. See developer console for more information.`,
            );
            console.log(e);
            return [];
        }
    }
    return patternIndexes;
};

export const formatPatternName = (patternIndex: number): string => {
    return (
        getSettings().patterns[patternIndex].name ||
        formatUnnamedPattern(patternIndex)
    );
};
