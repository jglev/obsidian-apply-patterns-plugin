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

export interface PatternRule {
    from: string;
    to: string;
    caseInsensitive: boolean;
    global: boolean;
    multiline: boolean;
    sticky: boolean;
    disabled?: boolean;
}

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

export const formatUnnamedPattern = (patternIndex: number): string =>
    `Pattern ${patternIndex + 1} (Untitled)`;

let settings: Settings = { ...defaultSettings };

export const getSettings = (): Settings => {
    return { ...settings };
};

export const updateSettings = (newSettings: Partial<Settings>): Settings => {
    settings = { ...cloneDeep(settings), ...cloneDeep(newSettings) };

    return getSettings();
};
