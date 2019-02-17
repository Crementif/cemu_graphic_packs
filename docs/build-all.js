const fse = require("fs-extra");
const packBuilder = require("./build-graphic-packs.js");

// Setup Variables
let src_input = "./site-src";
let src_output = "./publish";
let copyFiles = [
	"/css/index.css",
	"/css/universal.css",
	"/img/embed-icon.png",
	"/js/index.js",
	"/favicon.ico"
];
let repository_url = process.env.REPOSITORY_URL = process.env.REPOSITORY_URL || "https://github.com/slashiee/cemu_graphic_packs";

// Initialize shared variables
let buildPartPromises = [];


async function buildSite() {
	let buildSitePromises = [];
	await fse.emptyDir(src_output);
	fse.readFile(src_input+"/index.html", "utf8", (err, data) => {
		if (err) {
			console.error("Couldn't read the index file from the source folder...\n\rExiting build process!");
			process.exit(1);
		}
		let indexFile = data.split("{{ REPOSITORY_URL }}").join(repository_url);
		buildSitePromises.push(fse.writeFile(src_output+"/index.html", indexFile));
	});
	for (let i=0; i<copyFiles.length; i++) {
		buildSitePromises.push(fse.copy(src_input+copyFiles[i], src_output+copyFiles[i]));
	}
	return Promise.all(buildSitePromises);
}

// Start building (and measure build time)
console.time("Finished building the site");
console.time("Finished building the graphic packs");


let siteBuildPromise = buildSite().then(() => {
	console.timeEnd("Finished building the site");
}).catch(err => {
	console.error("Something went wrong while building the site files!", err);
	process.exit(1);
});

let packBuildPromise = packBuilder.buildAll("./../src/", "./../build/").then(() => {
	console.timeEnd("Finished building the graphic packs");
}).catch(err => {
	console.error("Something went wrong while building the graphic packs!", err);
	process.exit(1);
});