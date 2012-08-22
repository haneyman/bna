var Protobuf = $H();

Protobuf.Decoder = Class.create({
    initialize: function(description) {
        this.description = description;
        this.stream = null;
    },


    readUrl: function(urlIn) {
/*
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        req.overrideMimeType('text/plain; charset=x-user-defined');
        req.send(null);
        if (req.status != 200) throw '[' + req.status + ']' + req.statusText;
         this.stream = req.responseText;
 */


        var response="";
/*
        jQuery.ajaxSetup( { async: false } );
        jQuery.getJSON(urlIn,
            function(data) {
                alert('yo:' );
                //console.log('ajax protobuf success: ' + data);
                response = data;
            });
*/







        this.stream = response;
        var bytes = $A();
        for (i = 0; i < this.stream.length; i++) {
            bytes[i] = this.stream.charCodeAt(i) & 0xff;
        }
        return bytes;
    },

    decodeUrl: function(url) {
        return this.decode(this.readUrl(url));
    },

    decode: function(stream) {
        this.stream = stream;
        var ret = {};
        while (this.stream.length != 0) {
            var keys = this.readKey();
            var type = keys[0], tag = keys[1];
            var field = this.description[tag];
            if (!field) throw 'Invalid tag: ' + tag;
            switch (type) {
                case Protobuf.WireType.VARINT:
                    this.setField(ret, this.readVarint(), field);
                    break;
                case Protobuf.WireType.BIT64:
                    throw 'Not yet';
                    break;
                case Protobuf.WireType.LENGTH_DELIMITED:
                    var data = this.readLengthDelimited();
                    if (field.type == 'string') {
                        this.setField(ret, String.fromCharCode.apply(String, data), field);
                    }
                    else if (field.type == 'bytes') {
                        this.setField(ret, data, field);
                    }
                    else {
                        var embeddedDescription = this.description[field.type];
                        this.setField(ret, new Protobuf.Decoder(embeddedDescription).decode(data), field);
                    }
                    break;
                case Protobuf.WireType.START_GROUP:
                case Protobuf.WireType.END_GROUP:
                    throw 'Have not implemented error';
                    break;
                case Protobuf.WireType.BIT32:
                    throw 'Not yet';
                    break;
                default:
                    throw 'Unknown WireType: ' + type;
            }
        }
        return ret;
    },

    setField: function(obj, value, field) {
        if (field.rule == 'repeated') {
            if (!obj[field.name]) obj[field.name] = [];
            obj[field.name].push(value);
        }
        else {
            obj[field.name] = value;
        }
    },

    readKey: function() {
        var byte = this.stream.shift();
        var type = byte & 0x07;
        var tag = (byte & 0x7F) >>> 3;
        var first = true;
        if ((byte >> 7) != 0) {
            byte = this.stream.shift();
            tag = ((byte & 0x7F) << (first ? 4 : 7)) | tag;
        }
        return [type, tag];
    },

    readVarint: function() {
        var ret = 0;
        for (var i = 0; ; i++) {
            var byte = this.stream.shift();
            ret |= (byte & 0x7F) << (7 * i);
            if ((byte >> 7) == 0) break;
        }
        return ret;
    },

    readLengthDelimited: function() {
        var length = this.readVarint();
        var ret = $A();
        for (var i = 0; i < length; i++) {
            ret.push(this.stream.shift());
        }
        return ret;
    },

    // Methods for debug
    toBinaryString: function(val, figure) {
        var ret = '';
        var block = function() {
            ret = '' + (val & 1) + ret;
            val >>>= 1;
        };
        if (figure == null) {
            while (val != 0)  block();
        } else {
            for (var i = 0; i < 8; i++) block();
        }
        return ret;
    }
});

Protobuf.WireType = {
    VARINT           : 0,
    BIT64            : 1,
    LENGTH_DELIMITED : 2,
    START_GROUP      : 3,
    END_GROUP        : 4,
    BIT32            : 5
};
