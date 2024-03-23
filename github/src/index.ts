import {CPMContext, ActionInput, ActionOutput, CPMPlugin, Action} from '@cloudimpl-inc/cpm';
import {executeShellCommand} from "@cloudimpl-inc/cpm/dist/util";

const gitPlugin: CPMPlugin = {
    name: 'git',
    actions: {
        'pr create': async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
            const { head, base } = input.args;
            let {output: originUrl} = await executeShellCommand('git config --get remote.origin.url');
            originUrl = originUrl.split('\n')[0];
            const url = `${originUrl}/compare/${base}...${head}`
            console.log(`Please visit this URL to create pull request: ${url}`);
            return {};
        },
    }
};

export default function createGitPlugin(ctx: CPMContext): CPMPlugin {
    return gitPlugin;
}
