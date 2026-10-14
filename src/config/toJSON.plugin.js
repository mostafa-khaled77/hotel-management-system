module.exports.toJSONPlugin = (schema) => {
    schema.set('toJSON', {
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            delete ret._id;
            return ret;
        },
    });
};
