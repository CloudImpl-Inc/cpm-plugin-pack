import {CPMContext, ActionInput, ActionOutput, CPMPlugin, Action} from '@cloudimpl-inc/cpm';

const gitPlugin: CPMPlugin = {
    name: 'git',
    actions: {
        'pr create': async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
            const { head, base } = input.args;
            const url = `https://github.com/CloudImpl-Inc/beeplk/compare/${base}...${head}`
            console.log(`Please visit this URL to create pull request: ${url}`);
            return {};
        },
    }
};

export default function createGitPlugin(ctx: CPMContext): CPMPlugin {
    return gitPlugin;
}
