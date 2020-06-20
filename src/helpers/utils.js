import config from "./config";

/**
 * @method toggleDisplay
 * @description Toggles the display of a DOM element
 * @param element {HTML Element} element whose display we're toggling 
 */
function toggleDisplay(element) {
    element.style.display !== 'none' ? element.style.display = 'none' : element.style.display = 'block';
}

/**
 * @method getPlayersExcept
 * @description Returns players object excluding specified player
 * @param playersObject {Object} all the players
 * @param playerToExclude {string} player ID to exclude
 * @returns {Object} of players excluding specified player
 */
function getPlayersExcept(playersObject, playerToExclude) {
    let players = {};
    for (let player in playersObject) {
        if (player !== playerToExclude) {
            players[player] = playersObject[player];
        }
    }
    return players;
}

/**
 * @method isFieldEmpty
 * @description Checks if field passed in is empty
 * @param field {Object}
 * @returns {boolean} 
 */
function isFieldEmpty(field) {
    return field.fieldType === config.CONSTANTS.EMPTY_FIELD;
}

/**
 * @method checkPlayerTurnNext
 * @description Checks if player's turn is up next
 * @param player {Object}
 * @param playerTurn {Object}
 * @param allPlayers {Object}
 * @returns {boolean} 
 */
function checkPlayerTurnNext(player, playerTurn, allPlayers) {
    return player.order === (playerTurn.order + 1) || (player.order === 1 && playerTurn.order === (Object.keys(allPlayers).length + 1));
}

/**
 * @method getAvailableField
 * @description Checks if there is a field where cardPlanted can be planted
 * @param fields {Array} player's fields to check
 * @param cardPlanted {string} card type to check field type against
 * @returns {Object} field that is available 
 */
function getAvailableField(fields, cardPlanted) {
    let emptyFields = fields.filter((field) => isFieldEmpty(field));
    let matchingFields = fields.filter((field) => field.fieldType === getAssetNameWithoutSize(cardPlanted));
    return matchingFields.concat(emptyFields)[0];
}

/**
 * @method getPlacementVariables
 * @description Returns variables needed for placement of other players' fields, based on number of players connected
 * @param numOfPlayers {int} numbr of players connected
 * @returns {Object} variables based on number of players
 */
function getPlacementVariables(numOfPlayers) {
    let maxPlayers = numOfPlayers === 7;
    return {
        cardOffset: {
            x: maxPlayers ? 50 : 25,
            y: maxPlayers ? 55 : 35
        },
        counterOffset: {
            x: maxPlayers ? 0 : 10,
            y: maxPlayers ? 130 : 160
        },
        nameOffset: {
            x: 120,
            y: maxPlayers ? 30 : 10
        },
        distanceBetweenFields: maxPlayers ? 180 : 220
    }
}

/**
 * @method hideDOMElements
 * @description Hides DOM elements specified
 * @param elementsArray {Array} DOM elements to hide
 */
function hideDOMElements(elementsArray) {
    elementsArray.forEach( el => el.style.display = 'none');
}

/**
 * @method hideDOMElementsByIds
 * @description Hides DOM elements with specified IDs
 * @param parentNode {DOMElement} parent element whose children we want to hide
 * @param elementIdsArray {Array} IDs of elements to hide 
 */
function hideDOMElementsByIds(parentNode, elementIdsArray) {
    let elementsArray = [];
    elementIdsArray.forEach( id => {
        elementsArray.push(parentNode.getChildByID(id));
    });
    hideDOMElements(elementsArray);
}

/**
 * @method showDOMElements
 * @description Shows DOM elements specified
 * @param elementsArray {Array} DOM elements to show
 */
function showDOMElements(elementsArray) {
    elementsArray.forEach( el => el.style.display = 'block');
}

/**
 * @method showDOMElementsByIds
 * @description Show DOM elements with specified IDs
 * @param parentNode {DOMElement} parent element whose children we want to show
 * @param elementIdsArray {Array} IDs of elements to show
 */
function showDOMElementsByIds(parentNode, elementIdsArray) {
    let elementsArray = [];
    elementIdsArray.forEach( id => {
        elementsArray.push(parentNode.getChildByID(id));
    });
    showDOMElements(elementsArray);
}

/**
 * @function getBeanNameFromField
 * @description Helper function to return parsed bean name from field
 * @param {Object} field Field whose bean type we need to parse
 * @returns {string} the name of the beans planted in field
 */
function getBeanNameFromField(field) {
    let name = getBeanNameFromBeanType(field.fieldType);
    if (field.cardCount > 1) name += 's';
    return name;
}

/**
 * @function getBeanNameFromBeanType
 * @description Helper function to return parsed bean name by beanType
 * @param {string} beanType Bean type we want to parse
 * @returns {string} parsed bean name
 */
function getBeanNameFromBeanType(beanType) {
    return config.CONSTANTS.BEAN_NAME_MAP[beanType];
}

/**
 * @function adjustAssetSize
 * @description Helper function to change asset size
 * @param {string} assetName Asset name including asset size appended at the end
 * @param {string} desiredSize Desired asset size
 * @returns {string} new asset name with replaced asset size
 */
function adjustAssetSize(assetName, desiredSize) {
    return getAssetNameWithoutSize(assetName) + desiredSize;
}

/**
 * @function getAssetNameWithoutSize
 * @description Helper function to get asset name without size
 * @param {string} assetName Asset name including asset size appended at the end
 * @returns {string} asset name without asset size
 */
function getAssetNameWithoutSize(assetName) {
    if (assetName.indexOf(config.CONSTANTS.ASSET_SIZE.LARGE) !== -1) {
        return assetName.substring(0, assetName.indexOf(config.CONSTANTS.ASSET_SIZE.LARGE));
    } else if (assetName.indexOf(config.CONSTANTS.ASSET_SIZE.SMALL) !== -1) {
        return assetName.substring(0, assetName.indexOf(config.CONSTANTS.ASSET_SIZE.SMALL));
    } else { // there is no asset size appended
        return assetName;
    }
}

/**
 * @module utils
 * @description Module for util functions
 */
export default {
    toggleDisplay,
    getPlayersExcept,
    isFieldEmpty,
    getAvailableField,
    getPlacementVariables,
    hideDOMElements,
    hideDOMElementsByIds,
    showDOMElements,
    showDOMElementsByIds,
    getBeanNameFromField,
    getBeanNameFromBeanType,
    adjustAssetSize,
    getAssetNameWithoutSize,
    checkPlayerTurnNext
};
