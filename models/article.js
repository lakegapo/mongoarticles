var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var articleSchema = new mongoose.Schema({
	title: {
		type: String, 
	},
	// image: {
	// 	type: String, 
	// },	
	link: {
		type: String, 
	},
	// author: {
	// 	type: String, 
	// },		
	createdAt: {
		type: Date, 
		default: Date.now
	},
	comment: [{
		type: Schema.Types.ObjectId,
		ref: "Comment"
	}]
});

var Article = mongoose.model("Articles", articleSchema);

module.exports = Article;
