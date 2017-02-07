module.exports = IdModule;

var IdElement = {
	name: 'id',
	edit: function(main, block) {
		var div = document.createElement("div");
		div.setAttribute('block-state', 'loading');
		return div;
	}
};

function IdModule(main) {
	this.main = main;
	main.resolvers.id = IdResolver;
	main.modifiers.id = IdModifier;
	main.elements.id = IdElement;
}


IdModule.prototype.from = function(rootBlock, store, resolver) {
	if (!rootBlock) rootBlock = "";
	if (typeof rootBlock == "string") rootBlock = {
		type: 'fragment',
		content: {
			fragment: rootBlock
		}
	};
	var fragment = this.main.render(rootBlock);
	var nodes = fragment.querySelectorAll('[block-id]');
	var me = this;

	var list = [];
	for (var i=0; i < nodes.length; i++) {
		node = nodes[i];
		var id = node.getAttribute('block-id');
		var block = store[id];
		var p;
		if (block) {
			p = Promise.resolve(block);
		} else if (resolver) {
			p = Promise.resolve().then(function() {
				return resolver(id, store);
			});
		} else {
			p = Promise.reject(new Error("Unknown block id " + id));
		}
		list.push(p.then(function(block) {
			var node = this;
			return me.from(block, store, resolver).then(function(child) {
				node.parentNode.replaceChild(child, node);
			});
		}.bind(node)));
	}

	return Promise.all(list).then(function() {
		return fragment;
	});
};

IdModule.prototype.to = function(store) {
	var list = [];
	var main = this.main;
	main.modifiers.IdTo = function(main, block, dom) {
		if (block.id) {
			var div = dom.ownerDocument.createElement('div');
			div.setAttribute('block-id', block.id);
			list.push(block);
			return div;
		}
	};

	var domFragment = main.get();
	delete main.modifiers.IdTo;

	var block;
	for (var i = list.length - 1; i >= 0; i--) {
		block = list[i];
		store[block.id] = main.copy(block, false);
	}
	var div = domFragment.ownerDocument.createElement("div");
	div.appendChild(domFragment);

	return {
		type: 'fragment',
		content: {
			fragment: div.innerHTML
		}
	};
};

IdModule.prototype.clear = function(id) {
	if (id === undefined) {
		this.store = {};
	} else if (id == null || id == false) {
		console.warn('id.clear expects undefined or something not null');
	} else if (!this.store[id]) {
		console.warn('id.clear expects store to contain id', id);
	} else {
		delete this.store[id];
	}
};

IdModule.prototype.get = function(url) {
	var data = this.store[id];
	data.id = id;
	return data;
};

IdModule.prototype.set = function(data) {
	if (data && data.id) data = [data];
	for (var i = 0; i < data.length; i++) {
		this.store[data[i].id] = data[i];
	}
};

function IdResolver(main, obj, cb) {
	var id = obj.node && obj.node.getAttribute('block-id');
	if (!id) return;
	var block = IdModule.get(id);
	if (block) return block;
	if (IdResolver.fetch) IdResolver.fetch(id, function(err, block) {
		if (err) return cb(err);
		IdModule.set(block);
		cb(null, block);
	});
	return {
		type: 'id',
		id: id
	};
}

function IdModifier(main, block, dom) {
	if (block.id != null) dom.setAttribute('block-id', block.id);
	else dom.removeAttribute('block-id');
}


