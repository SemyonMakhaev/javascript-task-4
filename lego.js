'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var FUNCTION_PRIORITY = {
    filterIn: 1,
    and: 2,
    or: 3,
    sortBy: 4,
    select: 5,
    limit: 6,
    format: 6
};

/**
 * Запрос к коллекции
 * @param {Array} collection
 * @params {...Function} – Функции для запроса
 * @returns {Array}
 */
exports.query = function (collection) {
    var copy = copyCollection(collection);
    var functions = [].slice.call(arguments).slice(1);
    functions.sort(function (func1, func2) {
        return FUNCTION_PRIORITY[func1.name] - FUNCTION_PRIORITY[func2.name];
    });
    copy = functions.reduce(function (currentCollection, func) {
        return func(currentCollection);
    }, copy);

    return copy;
};

/**
 * Копирует объект
 * @param {Object} item
 * @returns {Object} - Копия
 */
function copyObject(item) {
    return JSON.parse(JSON.stringify(item));
}

/**
 * Копирует коллекцию
 * @param {Array} collection
 * @returns {Array} - Копия
 */
function copyCollection(collection) {
    return collection.map(copyObject);
}

/**
 * Выбор полей
 * @params {...String}
 * @returns {Function}
 */
exports.select = function () {
    var selectingFields = [].slice.call(arguments);

    return function select(collection) {
        var selected = collection.map(function (item) {
            return selectingFields.reduce(function (currentItem, field) {
                if (field in item) {
                    currentItem[field] = item[field];
                }

                return currentItem;
            }, {});
        });

        return selected;
    };
};

/**
 * Фильтрация поля по массиву значений
 * @param {String} property – Свойство для фильтрации
 * @param {Array} values – Доступные значения
 * @returns {Function}
 */
exports.filterIn = function (property, values) {
    return function filterIn(collection) {
        var filtered = [];
        collection.forEach(function (item) {
            for (var field in item) {
                if (item.hasOwnProperty(field) && property === field &&
                            values.indexOf(item[field]) !== -1 &&
                            !contains(item, filtered)) {
                    filtered.push(JSON.parse(JSON.stringify(item)));
                }
            }
        });

        return filtered;
    };
};

var ASCENDING_ORDER = 'asc';

/**
 * Сортировка коллекции по полю
 * @param {String} property – Свойство для фильтрации
 * @param {String} order – Порядок сортировки (asc - по возрастанию; desc – по убыванию)
 * @returns {Function}
 */
exports.sortBy = function (property, order) {
    return function sortBy(collection) {
        collection.sort(function (item1, item2) {
            if (item1[property] > item2[property]) {
                return order === ASCENDING_ORDER ? 1 : -1;
            }
            if (item1[property] < item2[property]) {
                return order === ASCENDING_ORDER ? -1 : 1;
            }

            return 0;
        });

        return collection;
    };
};

/**
 * Форматирование поля
 * @param {String} property – Свойство для фильтрации
 * @param {Function} formatter – Функция для форматирования
 * @returns {Function}
 */
exports.format = function (property, formatter) {
    return function format(collection) {
        collection.forEach(function (item, idx) {
            var newItem = {};
            for (var field in item) {
                if (field !== undefined) {
                    newItem[field] = field === property
                            ? formatter(item[field]) : item[field];
                }
            }
            collection[idx] = newItem;
        });

        return collection;
    };
};

/**
 * Ограничение количества элементов в коллекции
 * @param {Number} count – Максимальное количество элементов
 * @returns {Function}
 */
exports.limit = function (count) {
    return function limit(collection) {
        return count >= 0 ? collection.slice(0, count) : [];
    };
};

/**
 * Проверяет на совпадение элементы
 * @param {Object} item1 - Первый элемент
 * @param {Object} item2 - Второй элемент
 * @returns {Boolean} - Совпадают ли элементы
 */
function equals(item1, item2) {
    if (Object.keys(item1).length !== Object.keys(item2).length) {
        return false;
    }
    for (var field in item1) {
        if (item1.hasOwnProperty(field) && item1[field] !== item2[field]) {
            return false;
        }
    }

    return true;
}

/**
 * Проверяет наличие элемента в коллекции
 * @param {Object} item - Элемент
 * @param {Array} collection - Коллекция
 * @returns {Boolean} - Есть ли элемент в коллекции
 */
function contains(item, collection) {
    return collection.some(function (otherItem) {
        return equals(item, otherItem);
    });
}

if (exports.isStar) {

    /**
     * Фильтрация, объединяющая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Function}
     */
    exports.or = function () {
        var filters = [].slice.call(arguments);

        return function or(collection) {
            var filteredCollection = [];
            filters.forEach(function (filter) {
                filter(collection).forEach(function (item) {
                    if (!contains(item, filteredCollection)) {
                        filteredCollection.push(item);
                    }
                });
            });
            var result = [];
            collection.forEach(function (item) {
                if (contains(item, filteredCollection) &&
                                !contains(item, result)) {
                    result.push(item);
                }
            });

            return result;
        };
    };

    /**
     * Фильтрация, пересекающая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Function}
     */
    exports.and = function () {
        var filters = [].slice.call(arguments);

        return function and(collection) {
            filters.forEach(function (filter) {
                collection = filter(collection);
            });

            return collection;
        };
    };
}
