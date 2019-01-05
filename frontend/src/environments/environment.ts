// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
    production: true,
    // apiURL: 'http://etheroscope.alice.si',
    // socketURL: 'http://etheroscope.alice.si:8081/'
    apiURL: 'http://localhost:8082/',
    socketURL: 'http://localhost:8081/'
    // apiURL: 'http://35.246.120.150:8080/',
    // socketURL: 'http://35.246.65.214:80/',
};
