'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var SELECTING_FIELDS = [];
var FUNCTION_PRIORITY = {
    'filterIn': 1,
    'and': 2,
    'or': 3,
    'sortBy': 4,
    'select': 5,
    'limit': 6,
    'format': 6
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
        if (FUNCTION_PRIORITY[func1.name] > FUNCTION_PRIORITY[func2.name]) {
            return 1;
        }
        if (FUNCTION_PRIORITY[func1.name] < FUNCTION_PRIORITY[func2.name]) {
            return -1;
        }

        return 0;
    });
    functions.forEach(function (func) {
        copy = func(copy);
    });
    SELECTING_FIELDS = [];

    return copy;
};

/**
 * Копирует объект
 * @param {Object} item - Объект для копирования
 * @returns {Object} - Копия
 */
function copyObject(item) {
    var newItem = {};
    for (var field in item) {
        if (field !== undefined) {
            newItem[field] = item[field];
        }
    }

    return newItem;
}

/**
 * Копирует коллекцию
 * @param {Array} collection
 * @returns {Array} - Копия
 */
function copyCollection(collection) {
    var copy = [];
    collection.forEach(function (item) {
        copy.push(copyObject(item));
    });

    return copy;
}

/**
 * Выбор полей
 * @params {...String}
 * @returns {Function}
 */
exports.select = function () {
    var args = [].slice.call(arguments);
    args.forEach(function (arg) {
        if (SELECTING_FIELDS.indexOf(arg) < 0) {
            SELECTING_FIELDS.push(arg);
        }
    });

    return function select(collection) {
        var selected = [];
        collection.forEach(function (item) {
            var selectedItem = {};
            for (var field in item) {
                if (SELECTING_FIELDS.indexOf(field) >= 0) {
                    selectedItem[field] = item[field];
                }
            }
            selected.push(selectedItem);
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
            if (!(property in item) && !contains(item, filtered)) {
                filtered.push(copyObject(item));
            }
            for (var field in item) {
                if (property === field.toString() &&
                            values.indexOf(item[field]) >= 0 &&
                            !contains(item, filtered)) {
                    filtered.push(copyObject(item));
                }
            }
        });

        return filtered;
    };
};

var PREORDER = 'asc';

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
                return order === PREORDER ? 1 : -1;
            }
            if (item1[property] < item2[property]) {
                return order === PREORDER ? -1 : 1;
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
        return collection.slice(0, count);
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
        if (item1[field] !== item2[field]) {
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
    var itemContains = false;
    collection.forEach(function (otherItem) {
        if (equals(item, otherItem)) {
            itemContains = true;
        }
    });

    return itemContains;
}

/**
 * Убирает повторяющиеся элементы коллекции
 * @param {Array} collection - Коллекция
 * @returns {Array}
 */
function distinct(collection) {
    var items = [];
    collection.forEach(function (item) {
        if (!contains(item, items)) {
            items.push(item);
        }
    });

    return items;
}

/**
 * Оставляет только повторяющиеся элементы коллекции
 * @param {Array} collection - Коллекция
 * @returns {Array}
 */
function repetitions(collection) {
    var items = [];
    collection.forEach(function (item) {
        collection.forEach(function (otherItem) {
            if (item !== otherItem && equals(item, otherItem) &&
                                    !contains(item, items)) {
                items.push(item);
            }
        });
    });

    return items;
}

/**
 * Фильтрует коллекцию и применяет операцию к результату фильтрации
 * @param {Array} filters - Фильтрующие функции
 * @param {Array} collection - Коллекция
 * @param {Function} operation - Операция
 * @returns {Array} - Результат операции после фильтрации
 */
function applyCommonOperation(filters, collection, operation) {
    var items = [];
    filters.forEach(function (filter) {
        filter(collection).forEach(function (item) {
            items.push(item);
        });
    });

    return operation(items);
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
            return applyCommonOperation(filters, collection, distinct);
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
            return applyCommonOperation(filters, collection, repetitions);
        };
    };
}
