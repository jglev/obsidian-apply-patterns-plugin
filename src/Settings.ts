import cloneDeep from 'lodash.clonedeep';

export interface Settings {
    patterns: Pattern[];
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
};

let settings: Settings = { ...defaultSettings };

export const getSettings = (): Settings => {
    return { ...settings };
};

export const updateSettings = (newSettings: Partial<Settings>): Settings => {
    settings = { ...cloneDeep(settings), ...cloneDeep(newSettings) };

    return getSettings();
};
