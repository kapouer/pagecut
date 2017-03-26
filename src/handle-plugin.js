module.exports = function(main, options) {
	var handler = new Handler(main, options);
	return {
		props: {
			handleClick: handler.click,
			handleDOMEvents: {
				mousedown: handler.mousedown.bind(handler),
				mouseup: handler.mouseup.bind(handler),
				drop: handler.mouseup.bind(handler)
			}
		}
	};
};

function Handler(main, options) {
	this.main = main;
}



function createDOMHandle(doc, attrs) {
	var div = doc.createElement("div");
	div.innerHTML = "+";
	div.className = "block-handle";
	return div;
}


Handler.prototype.mousedown = function(view, e) {
	this.main.dragging = true;
	delete this.dragTarget;
	var dom = e.target;
	// get root node above target
	var pos = this.main.posFromDOM(dom);
	if (pos === false) {
		return;
	}
	var tr = view.state.tr;
	var info = this.main.parents(tr, pos);
	var root = info.root;

	if (root == null || info.content != null || info.wrap != null) {
		return;
	}

	// find root DOM node
	var posBefore = root.level ? root.rpos.before(root.level) : root.rpos.pos;
	var rposBefore = view.state.doc.resolve(posBefore);
	var rootDom = this.main.posToDOM(posBefore);

	if (!rootDom) return;

	var handleDom = rootDom.querySelector('[block-handle]');
	if (!handleDom) return;
	if (!isParentOf(handleDom, e.target)) return;

	tr = tr.setSelection(this.main.selectTr(tr, pos));
	tr.addToHistory = false;
	view.dispatch(tr);
	// drag handle
	e.target.draggable = false;
	handleDom.draggable = true;
	this.dragTarget = handleDom;
};


Handler.prototype.mouseup = function(view, e) {
	if (this.main.dragging) {
		this.main.dragging = false;
		if (this.dragTarget) {
			this.main.select(this.dragTarget);
			this.dragTarget.draggable = false;
			delete this.dragTarget;
		}
	}
};


function isParentOf(parent, node) {
	if (!node) return false;
	while (node) {
		if (parent == node) return true;
		node = node.parentNode;
	}
	return false;
}
