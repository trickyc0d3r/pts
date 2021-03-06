/*! Source code licensed under Apache License 2.0. Copyright © 2017-current William Ngan and contributors. (https://github.com/williamngan/pts) */

import {Group} from "./Pt";
import {Num} from "./Num";
import {WarningType, ITempoListener, ITempoStartFn, ITempoProgressFn, ITempoResponses} from "./Types";


/**
 * Various constant values for enumerations and calculations.
 */
export const Const = {

  /** A string to indicate xy plane. */
  xy: "xy",

  /** A string to indicate yz plane. */
  yz: "yz",

  /** A string to indicate xz plane. */
  xz: "xz",

  /** A string to indicate xyz space. */
  xyz: "xyz",

  /** Represents horizontal direction. */
  horizontal: 0,

  /** Represents vertical direction. */
  vertical: 1,

  /** Represents identical point or value */
  identical: 0,

  /** Represents right position or direction */
  right: 4,

  /** Represents bottom right position or direction */
  bottom_right: 5,

  /** Represents bottom position or direction */
  bottom: 6,

  /** Represents bottom left position or direction */
  bottom_left: 7,

  /** Represents left position or direction */
  left: 8,

  /** Represents top left position or direction */
  top_left: 1,

  /** Represents top position or direction */
  top: 2,

  /** Represents top right position or direction */
  top_right: 3,

  /** Represents an arbitrary very small number. It is set as 0.0001 here. */
  epsilon : 0.0001,

  /** Represents Number.MAX_VALUE */
  max: Number.MAX_VALUE,

  /** Represents Number.MIN_VALUE */
  min: Number.MIN_VALUE,

  /** π radian (180 deg) */
  pi: Math.PI,

  /** Two π radian (360deg) */
  two_pi : 6.283185307179586,

  /** Half π radian (90deg) */
  half_pi : 1.5707963267948966,

  /** π/4 radian (45deg) */
  quarter_pi : 0.7853981633974483,

  /** π/180 or 1 degree in radian */
  one_degree: 0.017453292519943295,

  /** Multiply this constant with a radian to get a degree */
  rad_to_deg: 57.29577951308232,

  /** Multiply this constant with a degree to get a radian */
  deg_to_rad: 0.017453292519943295,

  /** Gravity acceleration (unit: m/s^2) and gravity force (unit: Newton) on 1kg of mass. */
  gravity: 9.81,

  /** 1 Newton: 0.10197 Kilogram-force */
  newton: 0.10197,

  /** Gaussian constant (1 / Math.sqrt(2 * Math.PI)) */
  gaussian: 0.3989422804014327

};



/**
 * Util class provides static helper functions.
 */
export class Util {

  
  static _warnLevel:WarningType = "mute";

  /**
   * Set a global warning level setting. If no parameter is passed, this will return the current warn-level. See [`Util.warn`](#link).
   * @param lv a [`WarningType`](#link) option, where "error" will throw an error, "warn" will log in console, and "mute" will ignore the error. 
   */
  static warnLevel( lv?:WarningType ):WarningType {
    if (lv) {
      Util._warnLevel = lv;
    }
    return Util._warnLevel;
  }


  /**
   * Convert different kinds of parameters (arguments, array, object) into an array of numbers.  
   * @param args can be either a list of numbers, an array, a Pt, or an object with {x,y,z,w} properties
   */
  static getArgs( args:any[] ):Array<number> {
    if (args.length<1) return [];

    let pos = [];
    
    let isArray = Array.isArray( args[0] ) || ArrayBuffer.isView( args[0] );
    
    // positional arguments: x,y,z,w,...
    if (typeof args[0] === 'number') {
      pos = Array.prototype.slice.call( args );

    // as an object of {x, y?, z?, w?}
    } else if (typeof args[0] === 'object' && !isArray ) {
      let a = ["x", "y", "z", "w"];
      let p = args[0];
      for (let i=0; i<a.length; i++) {
        if ( (p.length && i>=p.length) || !(a[i] in p) ) break; // check for length and key exist
        pos.push( p[ a[i] ] );
      }

    // as an array of values
    } else if (isArray) {
      pos = [].slice.call( args[0] );
    }
    
    return pos;
  }


  /**
   * Send a warning message based on [`Util.warnLevel`](#link) global setting. This allows you to dynamically set whether minor errors should be thrown or printed in console or muted.
   * @param message any error or warning message
   * @param defaultReturn optional return value
   */
  static warn( message:string="error", defaultReturn:any=undefined ):any {
    if (Util.warnLevel() == "error") {
      throw new Error( message );
    } else if (Util.warnLevel() == "warn") {
      console.warn( message );
    }
    return defaultReturn;
  
  }


  /**
   * Get a random integer. This can be useful for selecting a random index in an array.
   * @param range value range
   * @param start Optional starting value
   */
  static randomInt( range:number, start:number=0 ) {
    return Math.floor( Math.random()*range ) + start;
  }


  /**
   * Split an array into chunks of sub-array.
   * @param pts an array 
   * @param size chunk size, ie, number of items in a chunk
   * @param stride optional parameter to "walk through" the array in steps
   * @param loopBack if `true`, always go through the array till the end and loop back to the beginning to complete the segments if needed
   */
  static split( pts:any[], size:number, stride?:number, loopBack:boolean=false ):any[][] {
    let st = stride || size;
    let chunks = [];
    for (let i=0; i<pts.length; i++) {
      if (i*st+size > pts.length) {
        if (loopBack) {
          let g = pts.slice(i*st);
          g = g.concat( pts.slice( 0, (i*st+size)%size ) );
          chunks.push( g );
        } else {
          break;
        }
      } else {
        chunks.push( pts.slice(i*st, i*st+size ) );
      }
    }
    return chunks;
  }


  /**
   * Flatten an array of arrays such as Group[] to a flat Array or Group.
   * @param pts an array, usually an array of Groups
   * @param flattenAsGroup a boolean to specify whether the return type should be a Group or Array. Default is `true` which returns a Group.
   */
  static flatten( pts:any[], flattenAsGroup:boolean=true ) {
    let arr = (flattenAsGroup) ? new Group() : new Array();
    return arr.concat.apply(arr, pts);
  }


  /**
    * Given two arrays of objects, and a function that operate on two objects, return an array. Objects must be of same type. 
    * @param a an array of object, eg `[Group, Group, ...]` 
    * @param b another array of object 
    * @param op a function that takes two parameters (a, b) and returns an object. 
  */
  static combine<T>( a:T[], b:T[], op:(a:T, b:T) => T ):T[] {
    let result = [];
    for (let i=0, len=a.length; i<len; i++) {
      for (let k=0, lenB=b.length; k<lenB; k++) {
        result.push( op(a[i], b[k]) );
      }
    }
    return result;
  }


  /**
   * Zip arrays. eg, `[[1,2],[3,4],[5,6]] => [[1,3,5],[2,4,6]]`.
   * @param arrays an array of arrays 
   */
  static zip( arrays:Array<any>[] ) {
    let z = [];
    for (let i=0, len=arrays[0].length; i<len; i++) {
      let p = [];
      for (let k=0; k<arrays.length; k++) {
        p.push( arrays[k][i] );
      }
      z.push( p );
    }
    return z;
  }


  /**
   * Create a convenient stepper. This returns a function which you can call repeatedly to step a counter.
   * @param max Maximum of the stepper range. The resulting stepper will return (min to max-1) values.
   * @param min Minimum of the stepper range. Default is 0.
   * @param stride Stride of the step. Default is 1.
   * @param callback An optional callback function `fn( step )`, which will be called each time when stepper function is called.
   * @example `let counter = stepper(100); let c = counter(); c = counter(); ...`
   * @returns a function which will increment the stepper and return its value at each call.
   */
  static stepper( max:number, min:number=0, stride:number=1, callback?:(n:number) => void ):(() => number) {
    let c = min;
    return function() {
      c += stride;
      if (c >= max) {
        c = min + (c-max);
      }
      if (callback) callback(c);
      return c;
    };
  }


  /**
   * A convenient way to step through a range. Same as `for (i=0; i<range; i++)`, except this also stores the resulting return values at each step and return them as an array.
   * @param range a range to step through
   * @param fn a callback function `fn(index)`. If this function returns a value, it will be stored at each step
   * @returns an array of returned values at each step  
   */
  static forRange( fn:(index:number) => any, range:number, start:number=0, step:number=1  ):any[] {
    let temp = [];
    for (let i=start, len=range; i<len; i+=step) {
      temp[i] = fn(i);
    }
    return temp;
  }


  /**
   * A helper function to load data from a url via XMLHttpRequest GET. Since the response passed into callback is a string, if you're loading json data, you may use standard `JSON.parse(response)` to get a JSON object. For csv, try using a javascript csv library like papaparse or vega/datalib.
   * @param url the request url
   * @param callback a function to capture the data. It receives two parameters: a `response` as string, and a `success` status as boolean.
   */
  static load( url:string, callback:(response:string, success:boolean) => void ) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        callback(request.responseText, true);
      } else {
        callback( `Server error (${request.status}) when loading "${url}"`, false);
      }
    };

    request.onerror = function() {
      callback( `Unknown network error`, false );
    };

    request.send();
  }
  
}


/**
 * Tempo is an utility class that helps you create synchronized and rhythmic animations.
 */
export class Tempo {

  protected _bpm: number; // beat per minute
  protected _ms: number; // millis per beat

  protected _listeners:{ [key:string]:ITempoListener } = {};
  protected _listenerInc:number = 0;

  /**
   * Construct a new Tempo instance by beats-per-minute. Alternatively, you can use [`Tempo.fromBeat`](#link) to create from milliseconds.
   * @param bpm beats per minute
   */
  constructor( bpm:number ) {
    this.bpm = bpm;
  }

  /**
   * Create a new Tempo instance by specifying milliseconds-per-beat.
   * @param ms milliseconds per beat
   */
  static fromBeat( ms:number ):Tempo {
    return new Tempo( 60000 / ms );
  }

  /**
   * Beats-per-minute value
   */
  get bpm():number { return this._bpm; }
  set bpm( n:number ) {
    this._bpm = n;
    this._ms = 60000 / this._bpm;
  }

  /**
   * Milliseconds per beat (Note that this is derived from the bpm value).
   */
  get ms():number { return this._ms; }
  set ms( n:number ) {
    this._bpm = Math.floor( 60000/n );
    this._ms = 60000 / this._bpm;
  }

  
  // Get a listener unique id
  protected _createID( listener:ITempoListener|Function ):string {
    let id:string = '';
    if (typeof listener === 'function') {
      id = '_b'+(this._listenerInc++);
    } else {
      id = listener.name || '_b'+(this._listenerInc++);
    }
    return id;
  }


  /**
   * This is a core function that let you specify a rhythm and then define responses by calling the `start` and `progress` functions from the returned object. See [Animation guide](../guide/Animation-0700.html) for more details.
   * The `start` function lets you set a callback on every start. It takes a function ([`ITempoStartFn`](#link)).
   * The `progress` function lets you set a callback during progress. It takes a function ([`ITempoProgressFn`](#link)). Both functions let you optionally specify a time offset and a custom name.
   * See [Animation guide](../guide/animation-0700.html) for more details.
   * @param beats a rhythm in beats as a number or an array of numbers
   * @example `tempo.every(2).start( (count) => ... )`, `tempo.every([2,4,6]).progress( (count, t) => ... )`
   * @returns an object with chainable functions 
   */
  every( beats:number|number[] ):ITempoResponses {
    let self = this;
    let p = Array.isArray(beats) ? beats[0] : beats;

    return {
      start: function (fn:ITempoStartFn, offset:number=0, name?:string): string {
        let id = name || self._createID( fn );        
        self._listeners[id] = { name: id, beats: beats, period: p, index: 0, offset: offset, duration: -1, smooth: false, fn: fn };
        return this;
      },

      progress: function (fn:ITempoProgressFn, offset:number=0, name?:string ): string {
        let id = name || self._createID( fn ); 
        self._listeners[id] = { name: id, beats: beats, period: p, index: 0, offset: offset, duration: -1, smooth: true, fn: fn };
        return this;
      }
    };
  }


  /**
   * Usually you can add a tempo instance to a space via [`Space.add`](#link) and it will track time automatically. 
   * But if necessary, you can track time manually via this function.
   * @param time current time in milliseconds
   */
  track( time ) {
    for (let k in this._listeners) {
      if (this._listeners.hasOwnProperty(k)) {

        let li = this._listeners[k];
        let _t = (li.offset) ? time + li.offset : time; 
        let ms = li.period * this._ms; // time per period
        let isStart = false;

        if (_t > li.duration + ms) {
          li.duration = _t - (_t % this._ms); // update 
          if (Array.isArray( li.beats )) { // find next period from array
            li.index = (li.index + 1) % li.beats.length;
            li.period = li.beats[ li.index ];
          }
          isStart = true;
        }

        let count = Math.max(0, Math.ceil( Math.floor(li.duration / this._ms)/li.period ) );
        let params = (li.smooth) ? [count, Num.clamp( (_t - li.duration)/ms, 0, 1), _t, isStart] : [count]; 
        let done = li.fn.apply( li, params );
        if (done) delete this._listeners[ li.name ];
      }
    }
  }


  /**
   * Remove a `start` or `progress` callback function from the list of callbacks. See [`Tempo.every`](#link) for details
   * @param name a name string specified when creating the callback function.
   */
  stop( name:string ):void {
    if (this._listeners[name]) delete this._listeners[name];
  }


  /**
   * Internal implementation for use when adding into Space
   */
  protected animate( time, ftime ) {
    this.track( time );
  }

}