const GameData = {
    // to add more categories, simply add another object to the clues array with a unique title and a list of items.
    // you can have as many categories and items as you like, but make sure that there are no duplicate items across categories and that each category has a unique title.
    // there may be as many items in each category as you like
    clues: [
        {
            title: 'numbers written as words',
            items: ['one', 'two', 'three', 'four', 'five'],
        },

        {
            title: 'made-up words',
            items: ['foo', 'baar', 'baz', 'flang', 'chust'],
        },

        {
            title: 'colours of the rainbow',
            items: ['red', 'orange', 'yellow', 'green', 'blue'],
        },

        {
            title: 'common animals',
            items: ['cat', 'dog', 'mouse', 'cow', 'pig'],
        },

        {
            title: 'common fruits',
            items: ['apple', 'banana', 'cherry', 'grape', 'pear'], // 'orange' is already used as a colour - should throw an error for duplicate items
        },
    ],
};

// Game Logic - do not edit below this line unless you are prepared to break the game!
const Game = {
    matchAgainst: null, // the currently selected item to match against
    categoryColors: 0, // keeps track of the colors assigned to categories to ensure easily distinguishable colours
    boardElem: document.getElementById('board'), // the main game board element where items are displayed and moved around
    statusElem: document.getElementById('status'), // the status element where messages about completed categories and game completion are displayed

    // Moves all child nodes of the given node to the target node
    // removes the original node from the board and assigns a background color to the target if it is not already a category
    addToCategory: function (node, target) {
        if (!this.isCategory(target)) {
            // either assign a new colour or inherit the colour from the category if the node being moved is already a category
            target.style.backgroundColor = (this.isCategory(node)) ? node.style.backgroundColor : this.generateColor();
        }
        // move all child nodes of the node being added to the target category
        while (node.childNodes.length > 0) {
            target.appendChild(node.firstChild);
        }
        // remove the original node from the board
        this.boardElem.removeChild(node);
    },
    
    // checks if all items in the category have been added 
    categoryComplete: function (node) {
        const category = this.findCategory(node);
        const categoryLength = node.childNodes.length;
        const expectedLength = GameData.clues.find(c => c.title == category).items.length;
        return categoryLength == expectedLength;
    },

    checkMatch: function (nodeElem) {
        // if the category is already complete, don't allow any more items to be added to it
        if (this.categoryComplete(nodeElem)) return;
        // if no item is currently selected, select the clicked item
        if (!this.matchAgainst) {
            this.select(nodeElem);
            return;
        }
        // if the clicked item is already selected, deselect it
        if (nodeElem == this.matchAgainst) {
            this.deselect(nodeElem);
            return;
        }
        // if the clicked item belongs to the same category as the currently selected item, merge them.
        if (this.findCategory(nodeElem) == this.findCategory(this.matchAgainst)) {
            this.addToCategory(this.matchAgainst, nodeElem);
            // if the category is now complete, display a message and mark the category as complete
            if (this.categoryComplete(nodeElem)) {
                let message = document.createElement('div');
                message.style.marginTop = '5px';
                message.innerHTML = `Completed: <span style="padding: 5px; background-color: ${nodeElem.style.backgroundColor}">${this.findCategory(nodeElem)}</span>`;
                this.statusElem.appendChild(message);
                nodeElem.classList.add('complete');
            }
            // deselect the currently selected item
            this.deselect(this.matchAgainst);
            // if the game is now complete, display a congratulatory message
            if (this.gameComplete()) {
                let message = document.createElement('div');
                message.innerHTML = '<b>Congratulations! You completed the game!</b>';
                this.statusElem.appendChild(message);
            }
            return;
        }
        // if the clicked item does not belong to the same category as the currently selected item, deselect the currently selected item and select the clicked item
        // TODO: could add some visual feedback here to indicate that the items do not match and maybe a counter.
        this.deselect(this.matchAgainst);
    },

    // creates the game board by shuffling all items from all categories and creating a button for each item.
    createBoard: function () {
        // error checking
        try {
            // Check for duplicate items across categories before creating the board
            const allItems = GameData.clues.reduce((acc, category) => acc.concat(category.items), []);
            const duplicates = allItems.filter((item, index) => allItems.indexOf(item) !== index);
            if (duplicates.length > 0) {
                throw 'Duplicate items found: ' + duplicates.join(', ');
            }

            // Check that each category has a unique title
            const titles = GameData.clues.map(category => category.title);
            const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
            if (duplicateTitles.length > 0) {
                throw 'Duplicate category titles found: ' + duplicateTitles.join(', ');
            }

            // Check that each category has more than one item
            for (const category of GameData.clues) {
                if (category.items.length < 2) {
                    throw `Category "${category.title}" must have at least 2 items.`;
                }
            }
        } catch (e) {
            this.boardElem.innerText = e;
            return;
        }
        // shuffle items and create a button for each item
        const allItems = GameData.clues.reduce((acc, category) => acc.concat(category.items), []);
        const shuffledItems = allItems
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
        shuffledItems.forEach(item => {
            // each button is in format of <button><span>item</span></button>
            // if more than one item is added to a category, the category button will be in format of
            //  <button><span>item1</span><span>item2</span>...</button>
            const itemElem = document.createElement('button');
            const spanElem = document.createElement('span');
            spanElem.innerText = item;
            itemElem.addEventListener('click', () => this.checkMatch(itemElem));
            itemElem.appendChild(spanElem);
            this.boardElem.appendChild(itemElem);
        });
    },

    // removes the 'selected' class from the given node and sets the currently selected item to null
    deselect: function (nodeElem) {
        nodeElem.classList.remove('selected');
        this.matchAgainst = null;
    },

    // finds the category title for the given node by checking which category in GameData.clues contains the text in the node's first span element.
    findCategory: function (node) {
        const strClue = node.firstChild.innerText;
        for (const category of GameData.clues) {
            if (category.items.includes(strClue)) {
                return category.title;
            }
        }
        // this shouldn't happen
        throw 'category not found for ' + strClue;
    },

    // checks if the game is complete by comparing the number of categories in GameData.clues with the number of categories marked as complete on the board.
    gameComplete: function () {
        numCategories = GameData.clues.length;
        numComplete = this.boardElem.querySelectorAll('.complete').length;
        return numCategories == numComplete;
    },

    // Generates a new color based on the number of colors already generated, ensuring a good distribution of hues.
    generateColor: function () {
        this.categoryColors++;
        const mostSigBit = ((n) => {
            let k = Math.floor(Math.log2(n));
            return 1 << k;
        })(this.categoryColors);
        const pos = this.categoryColors ^ mostSigBit;
        const spacing = 1 / mostSigBit;
        const offset = 1 / (mostSigBit << 1);
        let hue = (pos * spacing + offset) * 360;
        hue = (this.categoryColors % 5) ? hue : 360 - hue; // reverse every 5th color
        const sat = (this.categoryColors % 3)*15 + 60; // vary saturation between 60%, 75% and 90% to make them more distinguishable
        const light = (this.categoryColors % 2)*15 + 60; // vary lightness between 60% and 75% to make them more distinguishable
        const color = `hsl(${hue}, ${sat}%, ${light}%)`;
        return color;
    },

    // checks if the given node is a category by checking if it has more than one child node.
    isCategory: function (node) {
        return node.childNodes.length > 1
    },

    // adds the 'selected' class to the given node and sets the currently selected item to the given node.
    select: function (nodeElem) {
        nodeElem.classList.add('selected');
        this.matchAgainst = nodeElem;
    },
}

Game.createBoard();
