const fse = require("fs-extra");
const path = require("path");

async function buildAll(buildPathArg, outputPathArg) {
	let buildPath = path.normalize(buildPathArg);
	let outputPath = path.normalize(outputPathArg);
	
	console.info(`Building all games found in "${path.resolve(buildPath)}" directory.`);
	await fse.emptyDir(outputPath);
	
	// Asynchronously process each game...
	let gameFolders = await fse.readdir(buildPath, {withFileTypes: true});
	let gameBuildPromises = [];
	if (gameFolders == [] || gameFolders == undefined) {
		throw new Error("Couldn't locate the build path or didn't find any game folders to build...");
	}
	for (let i=0; i<gameFolders.length; i++) {
		if (gameFolders[i].isDirectory()) {
			let gameBuildPath = path.join(buildPath, gameFolders[i].name);
			console.groupCollapsed(`Building "${path.resolve(gameBuildPath)}" game`);
			gameBuildPromises.push(buildGame(gameBuildPath));
			console.groupEnd();
		}
	}
	return Promise.all(gameBuildPromises);
}

async function buildGame(buildPath) {
	// Synchronously process each pack (in case the build process in the future might need that)
	let packFolders = await fse.readdir(buildPath, {withFileTypes: true});
	let packBuildPromises = [];
	if (packFolders == []) {
		console.debug(`Couldn't find any files in "${buildPath}"`);
	}
	for (let i=0; i<packFolders.length; i++) {
		if (packFolders[i].isDirectory()) {
			packBuildPromises.push(buildPack());
		}
	}
	return Promise.all(packBuildPromises);
}

async function buildPack(buildPath) {
	return;
}

exports.buildAll = buildAll;
exports.buildGame = buildGame;
exports.buildPack = buildPack;