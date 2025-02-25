// 用00:00 格式判斷是早上、下午、晚上
const whatSchedule = (num) => {
    let newNum = Number(num);
    if(typeof(newNum) !== "number") return;

    if(newNum < 1200) return "morning";
    
    else if(newNum >= 1200 && newNum < 1800) return "afternoon";

    else if(newNum >= 1800) return "evening";

    return;
};

module.exports = whatSchedule;