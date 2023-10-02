const constants = require("./constants");

const IS_UUID = "$IS_UUID$";
const IS_PRESENT = "$IS_PRESENT$";

const FRIENDLY_NAMES = {
    [IS_UUID]: "[is UUID]",
    [IS_PRESENT]: "[is present]"
};

module.exports = {

    IS_UUID: IS_UUID,
    IS_PRESENT: IS_PRESENT,

    FRIENDLY_NAMES,

    isCompareFunction(expectedResult) {
        if (!expectedResult) {
            return false;
        }

        for (const key of Object.keys(FRIENDLY_NAMES)) {
            if (expectedResult === key) {
                return true;
            }
        }

        return false;
    },

    async compare(path, key, result, expectedResult) {
        if (expectedResult[key] === IS_UUID) {
            return await this.isUuid(path, key, result, expectedResult);
        } else if (expectedResult[key] === IS_PRESENT) {
            return await this.isPresent(path, key, result, expectedResult);
        }
    },

    formatPath(path, key) {
        return `${path ? path + "." : ""}${key}`;
    },

    async isUuid(path, key, result, expectedResult) {
        // Create a regexp to check if the result[key] is a uuid
        var uuid = new RegExp("^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$");

        // Check if key is a UUID
        if (uuid.test(result[key])) {
            return [{
                pass: true,
                key: this.formatPath(path, key),
                actualResult: result[key],
                expectedResult: "[is UUID]"
            }];
        }

        return [{
            pass: false,
            key: this.formatPath(path, key),
            actualResult: result[key],
            expectedResult: "[is UUID]",
            reason: constants.NOT_MATCHING
        }];
    },

    async isPresent(path, key, result, expectedResult) {
        // Check if key is present in result and expected result
        if (result[key]) {
            return [{
                pass: true,
                key: this.formatPath(path, key),
                actualResult: result[key],
                expectedResult: "[is present]"
            }];
        }

        return [{
            pass: false,
            key: this.formatPath(path, key),
            actualResult: null,
            expectedResult: "[is present]",
            reason: constants.KEY_MISSING 
        }];
    }
};