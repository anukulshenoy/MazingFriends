webpackHotUpdate(0,{

/***/ 283:
/*!******************************************!*\
  !*** ./src/components/Game/GameOver.jsx ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {/* REACT HOT LOADER */ if (true) { (function () { var ReactHotAPI = __webpack_require__(/*! ./~/react-hot-loader/~/react-hot-api/modules/index.js */ 2), RootInstanceProvider = __webpack_require__(/*! ./~/react-hot-loader/RootInstanceProvider.js */ 10), ReactMount = __webpack_require__(/*! react-dom/lib/ReactMount */ 12), React = __webpack_require__(/*! react */ 103); module.makeHot = module.hot.data ? module.hot.data.makeHot : ReactHotAPI(function () { return RootInstanceProvider.getRootInstances(ReactMount); }, React); })(); } try { (function () {
	
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(/*! react */ 103);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactRouter = __webpack_require__(/*! react-router */ 194);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var GameOver = function (_React$Component) {
	  _inherits(GameOver, _React$Component);
	
	  function GameOver(props) {
	    _classCallCheck(this, GameOver);
	
	    return _possibleConstructorReturn(this, (GameOver.__proto__ || Object.getPrototypeOf(GameOver)).call(this, props));
	  }
	
	  _createClass(GameOver, [{
	    key: 'quitGame',
	    value: function quitGame() {
	      document.getElementById("canvas").remove();
	      location.reload();
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return _react2.default.createElement(
	        'div',
	        { className: 'GameOver' },
	        _react2.default.createElement(
	          'h1',
	          null,
	          'Game Over!'
	        ),
	        ' ',
	        _react2.default.createElement('br', null),
	        _react2.default.createElement(
	          'h2',
	          null,
	          'Your time: ',
	          this.props.time
	        ),
	        ' ',
	        _react2.default.createElement('br', null),
	        _react2.default.createElement(
	          'button',
	          { className: 'homeButtons' },
	          'Keep Playing'
	        ),
	        ' ',
	        _react2.default.createElement('br', null),
	        _react2.default.createElement(
	          _reactRouter.Link,
	          { to: '/' },
	          _react2.default.createElement(
	            'button',
	            { className: 'homeButtons', onClick: this.quitGame.bind(this) },
	            'Quit'
	          )
	        )
	      );
	    }
	  }]);
	
	  return GameOver;
	}(_react2.default.Component);
	
	exports.default = GameOver;
	
	/* REACT HOT LOADER */ }).call(this); } finally { if (true) { (function () { var foundReactClasses = module.hot.data && module.hot.data.foundReactClasses || false; if (module.exports && module.makeHot) { var makeExportsHot = __webpack_require__(/*! ./~/react-hot-loader/makeExportsHot.js */ 278); if (makeExportsHot(module, __webpack_require__(/*! react */ 103))) { foundReactClasses = true; } var shouldAcceptModule = true && foundReactClasses; if (shouldAcceptModule) { module.hot.accept(function (err) { if (err) { console.error("Cannot apply hot update to " + "GameOver.jsx" + ": " + err.message); } }); } } module.hot.dispose(function (data) { data.makeHot = module.makeHot; data.foundReactClasses = foundReactClasses; }); })(); } }
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! ./../../../~/webpack/buildin/module.js */ 1)(module)))

/***/ }

})
//# sourceMappingURL=0.544b691f28064006d9bb.hot-update.js.map