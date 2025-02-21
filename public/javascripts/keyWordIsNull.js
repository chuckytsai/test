const keyWordIsNull = (data) => {
    if (data != undefined && data != null) return "%" + data + "%";

    return "%%";
};

module.exports = keyWordIsNull;