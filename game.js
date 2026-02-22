const GameData = {
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

const Game = {
    matchAgainst: null,
    categoryColors: [],
    boardElem: document.getElementById('board'),
    statusElem: document.getElementById('status'),

    addToCategory: function (node, target) {
        if (!this.isCategory(target)) {
            target.style.backgroundColor = (this.isCategory(node)) ? node.style.backgroundColor : this.generateColor();
        }
        while (node.childNodes.length > 0) {
            target.appendChild(node.firstChild);
        }
        this.boardElem.removeChild(node);
    },
    
    categoryComplete: function (node) {
        const category = this.findCategory(node);
        const categoryLength = node.childNodes.length;
        const expectedLength = GameData.clues.find(c => c.title == category).items.length;
        return categoryLength == expectedLength;
    },

    checkMatch: function (nodeElem) {
        if (this.categoryComplete(nodeElem)) return;
        if (!this.matchAgainst) {
            this.select(nodeElem);
            return;
        }
        if (nodeElem == this.matchAgainst) {
            this.deselect(nodeElem);
            return;
        }
        if (this.findCategory(nodeElem) == this.findCategory(this.matchAgainst)) {
            this.addToCategory(this.matchAgainst, nodeElem);
            if (this.categoryComplete(nodeElem)) {
                let message = document.createElement('div');
                message.style.marginTop = '5px';
                message.innerHTML = `Completed: <span style="padding: 5px; background-color: ${nodeElem.style.backgroundColor}">${this.findCategory(nodeElem)}</span>`;
                this.statusElem.appendChild(message);
                nodeElem.classList.add('complete');
            }
            this.deselect(this.matchAgainst);
            if (this.gameComplete()) {
                let message = document.createElement('div');
                message.innerHTML = '<b>Congratulations! You completed the game!</b>';
                this.statusElem.appendChild(message);
            }
            return;
        }
        this.deselect(this.matchAgainst);
    },

    createBoard: function () {
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
        const allItems = GameData.clues.reduce((acc, category) => acc.concat(category.items), []);
        const shuffledItems = allItems
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
        shuffledItems.forEach(item => {
            const itemElem = document.createElement('button');
            const spanElem = document.createElement('span');
            spanElem.innerText = item;
            itemElem.addEventListener('click', () => this.checkMatch(itemElem));
            itemElem.appendChild(spanElem);
            this.boardElem.appendChild(itemElem);
        });
    },

    deselect: function (nodeElem) {
        nodeElem.classList.remove('selected');
        this.matchAgainst = null;
    },

    findCategory: function (node) {
        const strClue = node.firstChild.innerText;
        for (const category of GameData.clues) {
            if (category.items.includes(strClue)) {
                return category.title;
            }
        }
        throw 'category not found for ' + strClue;
    },

    gameComplete: function () {
        numCategories = GameData.clues.length;
        numComplete = this.boardElem.querySelectorAll('.complete').length;
        return numCategories == numComplete;
    },

    // Generates a new color based on the number of colors already generated, ensuring a good distribution of hues.
    generateColor: function () {
        const numColors = this.categoryColors.length + 1;
        const mostSigBit = ((n) => {
            let k = Math.floor(Math.log2(n));
            return 1 << k;
        })(numColors);
        const pos = numColors ^ mostSigBit;
        const spacing = 1 / mostSigBit;
        const offset = 1 / (mostSigBit << 1);
        let hue = (pos * spacing + offset) * 360;
        hue = (numColors % 5) ? hue : 360 - hue; // reverse every 5th color
        const sat = (numColors % 3)*15 + 60;
        const light = (numColors % 2)*15 + 60;
        const color = `hsl(${hue}, ${sat}%, ${light}%)`;
        this.categoryColors.push(color);
        return color;
    },

    isCategory: function (node) {
        return node.childNodes.length > 1
    },

    select: function (nodeElem) {
        nodeElem.classList.add('selected');
        this.matchAgainst = nodeElem;
    },
}

Game.createBoard();
