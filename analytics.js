// Analytics file. For now just keep track of queries somewhere else.

// Is this neccessary? In theory can recreate this one?
const QueryAnalyticsSchema = new mongoose.Schema({
    userId: String,
    documentHash: String,
    queryContent: { type: String, required: true, unique: true},
    vectorization: String,
    conversationId: String,
    timestamp: Date,
});