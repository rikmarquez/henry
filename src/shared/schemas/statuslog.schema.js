"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusLogFilterSchema = void 0;
const common_schema_1 = require("./common.schema");
exports.statusLogFilterSchema = common_schema_1.paginationSchema.extend({
    serviceId: common_schema_1.idSchema.optional(),
    oldStatusId: common_schema_1.idSchema.optional(),
    newStatusId: common_schema_1.idSchema.optional(),
    changedBy: common_schema_1.idSchema.optional(),
    dateFrom: common_schema_1.dateSchema.optional(),
    dateTo: common_schema_1.dateSchema.optional(),
});
