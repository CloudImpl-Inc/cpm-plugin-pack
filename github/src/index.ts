import {CPMContext, ActionInput, ActionOutput, CPMPlugin, Action} from '@cloudimpl-inc/cpm';
import {executeShellCommand} from "@cloudimpl-inc/cpm/dist/util";
import {execSync} from "child_process";

const gitPlugin: CPMPlugin = {
    name: 'git',
    actions: {
        'pr create': async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
            const { head, base } = input.args;
            let originUrl = execSync('git config --get remote.origin.url').toString();
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
