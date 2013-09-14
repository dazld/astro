// constants. kinda.

var TWOPI = Math.PI * 2;

var Player = function(x, y, controls) {

	this.position = new vector2d(x, y);
	this.direction = Math.random() * 6.282;
	this.path = [{
		x: 50,
		y: 50
	}, {
		x: -50,
		y: 50	
	}, {
		x: 20,
		y: -50
	}];
	this.controls = controls;
	this.speed = 0;
	this.autopilot = false;
};

Player.prototype.update = function() {
	
	this.accel(this.controls.UP);
	this.rotate();

	if (this.position.vx > window.innerWidth) {
		this.position.vx = 0;
	} else if (this.position.vx < 0) {
		this.position.vx = window.innerWidth
	}
	if (this.position.vy > window.innerHeight) {
		this.position.vy = 0;
	} else if (this.position.vy < 0) {
		this.position.vy = window.innerHeight
	}
	
	
};

Player.prototype.draw = function(ctx) {
	ctx.save();
	ctx.translate(this.position.vx, this.position.vy);
	ctx.rotate(this.direction);
	ctx.translate(-25, -50);
	ctx.beginPath();
	ctx.strokeStyle = "white";
	ctx.moveTo(0, 0);
	var cx = 0;
	var cy = 0;
	this.path.forEach(function(point) {
		ctx.lineTo(cx + point.x, cy + point.y);
		cx += point.x;
		cy += point.y;
	}, this);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.restore();
};

Player.prototype.rotate = function() {
	if (this.controls.LEFT) {
		this.direction = this.direction - 0.051;
	} else if (this.controls.RIGHT) {
		this.direction = this.direction + 0.051;
	}

};

Player.prototype.accel = function(add) {
	if (add) {
		this.speed = this.speed + 0.25;
		// if (this.speed > 10) {
		// 	this.speed = 10;
		// };
	} else {
		this.speed = this.speed * 0.98;
		if (this.speed < 0.1) {
			this.speed = 0;
		};
	}



	var accel = new vector2d(1, 0);
	accel.rotate(this.direction);
	accel.scale(this.speed)

	// var blackHole = new vector2d(window.innerWidth/2-this.position.vx,window.innerHeight/2-this.position.vy);
	// // blackHole.rotate(this.direction);
	// var dist = blackHole.normalize();

	// blackHole.scale(Math.log(dist)+1);
	// accel.add(blackHole);

	this.position.add(accel)

};

var Bus = function() {

	if (this instanceof Bus === false) {
		throw new Error('not called as a constructor');
		return false;
	};

	var bus = document.createElement('div');

	this.trigger = function(evt, data) {
		var e = new Event(evt);
		e.data = data;
		return bus.dispatchEvent(e);
	}

	this.on = function(evt, callback, context) {

		context = context || window;
		var boundCallback = callback.bind(context);
		bus.addEventListener(evt, boundCallback, false);
		return boundCallback;
	}

	this.off = function(evt, callback) {
		bus.removeEventListener(evt, callback);
	}

	return this;

}

function Game(options) {
	options = options || {};
	options.events = options.events || {};
	var that = this;
	var c = this.canvas = document.createElement('canvas');
	this.ctx = c.getContext('2d');
	this.bus = new Bus();

	var devicePixelRatio = window.devicePixelRatio || 1;
	var backingStoreRatio = this.ctx.webkitBackingStorePixelRatio || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;

	this.drawRatio = devicePixelRatio / backingStoreRatio;
	var sizeStageBound = this.sizeStage.bind(this);
	var handleKeyBound = this.handleKey.bind(this);

	window.addEventListener('resize', sizeStageBound);
	window.addEventListener('keydown', handleKeyBound);
	window.addEventListener('keyup', handleKeyBound);

	// bind events passed at options
	this.bindEvents(options.events);

	// size the stage and append it to doc
	var a = this.bindEvent('resize', function(e) {
		that.height = e.data.height;
		that.width = e.data.width;
	});


	var dims = sizeStageBound();
	document.body.appendChild(c);
};


Game.prototype.players = [];
Game.prototype.controlsState = {
	UP: false,
	LEFT: false,
	DOWN: false,
	RIGHT: false,
	FIRE: false
};
Game.prototype.bindEvent = function(evt, callback) {
	var cb = this.bus.on(evt, callback, this);
	return cb;
}
Game.prototype.bindEvents = function(events) {
	var cbs = [];
	for (var e in events) {
		var cb = this.bus.on(e, events[e], this);
		cbs.push(cb);
	}
	return cbs;
}
Game.prototype.handleKey = function(e) {

	var toggle = e.type === 'keyup' ? false : true;

	switch (e.keyCode) {
		case 37:
			this.controlsState.LEFT = toggle;
			break;
		case 38:
			this.controlsState.UP = toggle;
			break;
		case 39:
			this.controlsState.RIGHT = toggle;
			break;
		case 40:
			this.controlsState.DOWN = toggle;
			break;
		case 32:
			this.controlsState.FIRE = toggle;
			console.log('pew pew')
			break;
		default:
			console.log(e.keyCode);
			break;
	}
};

Game.prototype.tick = function(){
	this.ctx.clearRect(0, 0, this.width, this.height);
	this.players.forEach(function(player){
		player.update();
		player.draw(this.ctx);
	},this);
	
	window.requestAnimationFrame(this.tick.bind(this))

};

Game.prototype.sizeStage = function(e) {

	var height = window.innerHeight;
	var width = window.innerWidth;
	var dims = {
		width: width,
		height: height
	};

	this.canvas.setAttribute('height', height * this.drawRatio);
	this.canvas.setAttribute('width', width * this.drawRatio);
	this.canvas.style.width = width + "px";
	this.canvas.style.height = height + "px";
	this.ctx.scale(this.drawRatio, this.drawRatio);
	this.bus.trigger('resize', dims);

	return dims;
};

var game = new Game();
var numPlayers = 10;
while(numPlayers > 0){
	var p = new Player(Math.random()*window.innerWidth, Math.random()*window.innerHeight, game.controlsState);
	game.players.push(p);
	numPlayers--;
}

game.tick();

