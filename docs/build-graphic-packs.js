const fse = require("fs-extra");
const path = require("path");
const ini = require("ini");

async function buildAll(buildPathArg, outputPathArg) {
	let buildPath = path.normalize(buildPathArg);
	let outputPath = path.normalize(outputPathArg);
	
	console.info(`Building all games found in "${path.resolve(buildPath)}" directory.`);
	await fse.emptyDir(outputPath);
	
	// Asynchronously process each game...
	let gameFolders = await fse.readdir(buildPath, {withFileTypes: true});
	let gameBuildPromises = [];
	if (gameFolders === [] || gameFolders === undefined) {
		throw new Error("Couldn't locate the build path or didn't find any game folders to build...");
	}
	for (let i=0; i<gameFolders.length; i++) {
		if (gameFolders[i].isDirectory()) {
			let gameBuildPath = path.join(buildPath, gameFolders[i].name);
			gameBuildPromises.push(buildGame(gameBuildPath));
		}
	}
	return Promise.all(gameBuildPromises);
}

async function buildGame(buildPath) {
	let buildTimingStart = new Date();
	let gameBuildOutput = "";
	// Synchronously process each pack (in case the build process in the future might need that)
	let packFolders = await fse.readdir(buildPath, {withFileTypes: true});
	if (packFolders === []) {
		console.debug(`[${path.basename(buildPath)}] Couldn't find any packs for this game...`);
		return;
	}
	for (let i=0; i<packFolders.length; i++) {
		if (packFolders[i].isDirectory()) {
			let packOutput = await buildPack(path.join(buildPath, packFolders[i].name));
			gameBuildOutput += `${packFolders.length-1===i? "└─" : "├─"} ${packFolders[i].name} - ${packOutput}${packFolders.length-1===i? "" : "\n"}`;
		}
	}
	// Output debug stuff
	console.info(`[${path.basename(buildPath)}] Finished building game in %dms\n${gameBuildOutput}`, new Date()-buildTimingStart);	
}

async function buildPack(buildPath) {
	// Asynchronously process each shader or patches after reading the rules.txt file.
	let packFiles = await fse.readdir(buildPath, {withFileTypes: true});
	
	// Extracted information from pack
	let packInformation = {
		// Used for testing (preventing errors within Cemu)
		packPresets: {},
		resolutionExpression: undefined,
		// Meta-ish information
		titleIds: [],
		name: undefined,
		path: undefined,
		description: undefined,
		requiresCemuhook: false,
		nativeResolution: undefined,
		// Pack API Information
		customInputTag: undefined,
	};
	
	if (packFiles === []) {
		return "Couldn't find any files!";
	}
	if (!await fse.pathExists(path.join(buildPath, "rules.txt"))) {
		return "No rules.txt file was found!";
	}
	try {
		let rules = parseRules(await fse.readFile(path.join(buildPath, "rules.txt"), {encoding:"utf8"}));
	}
	catch(err) {
		return err;
	}
	for (let i=0; i<packFiles.length; i++) {
		if (packFiles[i].isFile()) {
			let gameFile = await fse.readFile(path.join(buildPath, packFiles[i].name), {encoding:"utf8"});
		}
	}
	return JSON.stringify(packInformation);
}

function parseRules(rulesContent) {
	// Build process also generates a quality report to improve code quality.
	let parsedQualityReport = { // Not fully implemented as of now, but just an idea of what could be considered "good practices".
		// Weird things that are unlikely to happen, but things that should always be true
		DefinitionIsNotFirstSection: false,
		PresetsAfterTextureRedefineSection: false,
		NoDescription: false,
		
		// Should be avoided since it can clip descriptions, path or names. Just assign them without quotes.
		UsesQuotesInDescription: false,
		UsesQuotesInPath: false,
		UsesQuotesInName: false,
		
		OverlapBetweenTextureRules: false, // Triggers if rule X could interfere with rule Y due to being limited
		RedundantOverwrites: false,
		
		EmptyComments: false, // Empty comments are just junk.
		DoubleSlashComments: false, // These shouldn't exist! Cemu ignores them currently on blank lines, but these should be removed.
		DoubleHashComments: false, // Two comments on 1 line isn't necessary a bad thing, but it's easy to log.
	};
	// Test if all presets are valid and don't contain inconsistent presets.
	let rulesLines = rulesContent.split("\n");
	
	let currSection = undefined;
	for (let i=0; i<rulesLines.length; i++) {
		// Ignore comment contents
		let seperateLines = rulesLines[i].split("#");
		let cleanLine = seperateLines[0];
		if (seperateLines.length === 2) {
			if (seperateLines[1].trim() === "") parsedQualityReport.EmptyComments = true;
			else if (seperateLines[1].includes("=")) {
				if (rulesLines.split("#")[1].split("=")[1].trim()==="") parsedQualityReport.EmptyComments = true; // Filter lines like "#formats=" since they're also just junk.
			}
		}
		if (seperateLines.length >= 3) parsedQualityReport.DoubleHashComments = true;
	}
	if (parsedQualityReport.EmptyComments) console.log("JUINKK");
}

function mainFunction() {
	if (require.main === module) {
	} else {
	}
}
mainFunction();

exports.buildAll = buildAll;
exports.buildGame = buildGame;
exports.buildPack = buildPack;