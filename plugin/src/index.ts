import {CPMPluginCreator} from "@cloudimpl-inc/cpm";

const init: CPMPluginCreator = ctx => {
    return {
        name: 'plugin-name',
        actions: {
            'test': (ctx, input) => {
                console.log(`input = ${JSON.stringify(input)}`);
                return {result: 'hello world'};
            }
        }
    }
}

export default init;