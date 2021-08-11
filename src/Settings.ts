import cloneDeep from 'lodash.clonedeep';

export interface Settings {
    patterns: Pattern[];
    filterString?: string;
    commandFilterString?: string;
    commands: Command[];
    apiVersion?: number;
}

export interface Pattern {
    name: string;
    done: boolean;
    rules: PatternRule[];
}

export const defaultPatternSettings: Pattern = {
    name: '',
    done: false,
    rules: [],
};

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
    apiVersion: 2,
};

export interface Command {
    name: string;
    patternFilter: string;
    selection: boolean;
    lines: boolean;
    document: boolean;
}

export const defaultCommandSettings: Command = {
    name: '',
    patternFilter: '',
    selection: true,
    lines: true,
    document: true,
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
