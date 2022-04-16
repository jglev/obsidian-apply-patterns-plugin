import cloneDeep from 'lodash.clonedeep';
import * as Guards from './Settings.guard';

// Typeguard functions for the interfaces below (to enable running, e.g.,
// isPattern() on a JSON object). When the interfaces below change, these guard
// functions can be regenerated with
// 'yarn generate-typeguard-functions' (see package.json).
export { Guards };

/** @see {isSettings} ts-auto-guard:type-guard */
export interface Settings {
	patterns: Pattern[];
	filterString?: string;
	commandFilterString?: string;
	commands: Command[];
	defaultCursorRegexStart: string;
	defaultCursorRegexEnd: string;
	apiVersion?: number;
}

/** @see {isPattern} ts-auto-guard:type-guard */
export interface Pattern {
	name: string;
	rules: PatternRule[];
	collapsed: boolean;
	cursorRegexStart: string;
	cursorRegexEnd: string;
}

export const defaultPatternSettings: Pattern = {
	name: '',
	rules: [],
	collapsed: false,
	cursorRegexStart: '^',
	cursorRegexEnd: '$',
};

/** @see {isPatternRule} ts-auto-guard:type-guard */
export interface PatternRule {
	from: string;
	to: string;
	caseInsensitive: boolean;
	global: boolean;
	multiline: boolean;
	sticky: boolean;
	disabled?: boolean;
}

export const defaultPatternRuleSettings: PatternRule = {
	from: '',
	to: '',
	caseInsensitive: false,
	global: false,
	multiline: false,
	sticky: false,
	disabled: false,
};

export const defaultSettings: Settings = {
	patterns: [],
	filterString: '',
	commandFilterString: '',
	commands: [],
	apiVersion: 6,
	defaultCursorRegexEnd: '^',
	defaultCursorRegexStart: '$',
};

/** @see {isCommand} ts-auto-guard:type-guard */
export interface Command {
	name: string;
	icon?: string;
	patternFilter: string;
	selection?: boolean;
	lines?: boolean;
	document?: boolean;
	clipboard?: boolean;
	clipboardLines?: boolean;
}

export const defaultCommandSettings: Command = {
	name: '',
	icon: 'search',
	patternFilter: '',
	selection: true,
	lines: true,
	document: true,
	clipboard: false,
	clipboardLines: false,
};

export const formatUnnamedPattern = (patternIndex: number): string =>
    `Pattern ${patternIndex + 1} (Untitled)`;

let settings: Settings = { ...defaultSettings };

export const getSettings = (): Settings => {
    return { ...cloneDeep(settings) };
};

export const clearSettings = () => {
    settings = { ...cloneDeep(defaultSettings) };
    return getSettings();
};

export const updateSettings = (newSettings: Partial<Settings>): Settings => {
    settings = { ...cloneDeep(settings), ...cloneDeep(newSettings) };
    settings.commands.forEach((command: Command) => {
        command = { ...defaultCommandSettings, ...command };
    });
    settings.patterns.forEach((pattern: Pattern) => {
        pattern = { ...defaultPatternSettings, ...pattern };
        pattern.rules.forEach((rule: PatternRule) => {
            rule = { ...defaultPatternRuleSettings, ...rule };
        });
    });

    return getSettings();
};
