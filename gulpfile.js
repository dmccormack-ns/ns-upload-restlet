const gulp = require('gulp');
const tsc = require('gulp-typescript');
const tsProject = tsc.createProject('tsconfig.json');
const sh = require('child_process').spawn;
const nscabinet = require('nscabinet');

gulp.task('build', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist/FileCabinet/SuiteScripts"));
});

gulp.task('deploy', ['build'], () => {
    // sh('./sdfcli deploy', (err, stdout, stderr) => {
    //     console.log(stdout);
    //     console.log(stderr);
    // })
    const deploy = sh('mvn', ['-f ./sdf/win/pom.xml', 'exec:java', '-Dexec.args="deploy -np -sv"'], { shell: true });
    // deploy.stdout.setEncoding('utf8');
    deploy.stdout.on('data', (data) => {
        let sdfcli = data.toString();
        if (sdfcli.startsWith("SuiteCloud")) {
            deploy.stdin.write("\n");
            console.log("MURP");
        }
        if (sdfcli.startsWith("WARNING! You are deploying to a Production accoun")) {
            deploy.stdin.write("YES\n");
        }
        // console.log(data.toString());
        else {
            console.log(sdfcli);
        }
    });
    deploy.on('message', (msg) => {
        console.log(`MEssage: ${msg}`);
    });
    deploy.stderr.on('data', (data) => {
        console.log(data.toString());
        console.log("ERROR");
    });
    deploy.on('close', (code) => {
        console.log("exited with code " + code);
    });
});
gulp.task("upload-manifest", ["upload-files"], () => {
     return gulp.src(['src/tests/SSP Applications/sca/manifest.txt'])
        .pipe(nscabinet({ rootPath: '/Web Site Hosting Files' }));
});
gulp.task("upload-files", [], () => {
    return gulp.src(['src/tests/SSP Applications/sca/**/*', '!src/tests/SSP Applications/sca/manifest.txt'])
        .pipe(nscabinet({ rootPath: '/Web Site Hosting Files' }));
})

