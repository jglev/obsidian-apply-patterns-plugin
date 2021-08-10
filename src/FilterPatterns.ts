import { Notice } from 'obsidian';

import {
    Command,
    Pattern,
    PatternRule,
    formatUnnamedPattern,
    getSettings,
} from 'Settings';

export const filterPatterns = (command?: Command): number[] => {
    const patterns = getSettings().patterns;
    let patternIndexes: number[] = getSettings()
        .patterns.filter(
            (pattern: Pattern) =>
                pattern.rules.length > 0 &&
                pattern.rules.every((rule: PatternRule) => rule.from !== ''),
        )
        .map((_: Pattern, patternIndex: number) => {
            return patternIndex;
        });

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
