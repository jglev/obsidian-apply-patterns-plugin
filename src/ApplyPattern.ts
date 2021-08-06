import {
    App,
    Editor,
    EditorTransaction,
    MarkdownView,
    Notice,
    View,
} from 'obsidian';

import { validateRuleString } from './ValidateRuleString';
import { PatternModal } from './PatternsModal';
import { getSettings } from './Settings';

// import { PatternRule } from '../Settings';

export const applyPattern = (
    checking: boolean,
    editor: Editor,
    view: View,
    app: App,
    mode: 'lines' | 'selection' = 'lines',
) => {
    if (checking) {
        // editorCallback always happens in a MarkdownView; the command should
        // only be shown in MarkdownView:
        return true;
    }

    if (!(view instanceof MarkdownView)) {
        // Should never happen due to check above.
        return;
    }

    // We are certain we are in the editor due to the check above.
    const path = view.file?.path;
    if (path === undefined) {
        return;
    }

    const onChooseItem = (patternIndex: number): void => {
        const pattern = getSettings().patterns[patternIndex];
        const cursorFrom = editor.getCursor('from');
        const cursorTo = editor.getCursor('to');
        const minLine = cursorFrom.line;
        const maxLine = cursorTo.line;

        // Confirm that each rule's strings are valid:
        let allValid = true;
        const allRuleStringsValidated: { from: string; to: string }[] = [];

        for (let ruleIndex = 0; ruleIndex < pattern.rules.length; ruleIndex++) {
            const rule = pattern.rules[ruleIndex];
            if (rule.disabled === true) {
                // Push a placeholder, to avoid messing up index numbers below:
                allRuleStringsValidated.push({
                    from: '',
                    to: '',
                });
                continue;
            }
            const fromValidated = validateRuleString(rule.from);
            const toValidated = validateRuleString(rule.to, false);
            allRuleStringsValidated.push({
                from: fromValidated.string,
                to: toValidated.string,
            });
            const noticeTimeoutSeconds = 1000 * 30; // 30 seconds
            if (!fromValidated.valid) {
                new Notice(
                    `Error: "${rule.from}" is not valid: "${fromValidated.string}". Stopping before editing the text.`,
                    noticeTimeoutSeconds,
                );
                allValid = false;
            }
            if (toValidated.valid === false) {
                new Notice(
                    `Error: "${rule.to}" is not valid: "${toValidated.string}". Stopping before editing the text.`,
                    noticeTimeoutSeconds,
                );
                allValid = false;
            }
        }
        if (allValid !== true) {
            return; // Stop the function prematurely
        }

        const transaction: EditorTransaction = {
            changes: [],
        };

        if (mode === 'lines') {
            const updatedLines: string[] = [];
            for (
                let lineNumber = minLine;
                lineNumber <= maxLine;
                lineNumber++
            ) {
                let line = editor.getLine(lineNumber);
                pattern.rules.forEach((rule, ruleIndex) => {
                    if (rule.disabled === true) {
                        // Skip the rule if it's disabled:
                        return;
                    }
                    line = line.replace(
                        new RegExp(
                            allRuleStringsValidated[ruleIndex].from,
                            `u${rule.caseInsensitive ? 'i' : ''}${
                                rule.global ? 'g' : ''
                            }${rule.multiline ? 'm' : ''}${
                                rule.sticky ? 's' : ''
                            }`,
                        ),
                        allRuleStringsValidated[ruleIndex].to,
                    );
                });
                updatedLines.push(line);
            }
            transaction.changes?.push({
                from: { line: minLine, ch: 0 },
                to: { line: maxLine, ch: editor.getLine(maxLine).length },
                text: updatedLines.join('\n'),
            });
        }

        if (mode === 'selection') {
            let updatedSelection = editor.getSelection();
            pattern.rules.forEach((rule, ruleIndex) => {
                updatedSelection = updatedSelection.replace(
                    new RegExp(
                        allRuleStringsValidated[ruleIndex].from,
                        `u${rule.caseInsensitive ? 'i' : ''}${
                            rule.global ? 'g' : ''
                        }${rule.multiline ? 'm' : ''}${rule.sticky ? 's' : ''}`,
                    ),
                    allRuleStringsValidated[ruleIndex].to,
                );
            });
            transaction.replaceSelection = updatedSelection;
        }

        editor.transaction(transaction);
    };

    // Need to create a new instance every time, as cursor can change.
    const patternModal = new PatternModal({
        app,
        onChooseItem,
    });
    patternModal.open();
};