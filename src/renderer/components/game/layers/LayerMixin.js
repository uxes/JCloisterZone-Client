import { mapGetters } from 'vuex'
import Location from '@/models/Location'

export default {
  computed: mapGetters({
    bridges: 'game/bridges',
    colorCssClass: 'game/colorCssClass',
    isDragging: 'board/isDragging',
    tileOn: 'game/tileOn'
  }),

  methods: {
    positionAsKey (pos) {
      return `${pos[0]},${pos[1]}`
    },

    pointerAsKey (ptr) {
      return `${ptr.position[0]},${ptr.position[1]},${ptr.location}`
    },

    getX (pos) {
      return pos[0] * 1000
    },

    getY (pos) {
      return pos[1] * 1000
    },

    getTilePoint ({ position, location }) {
      const tile = this.tileOn(position)
      const feature = this.$theme.getFeature(tile, location, this.bridges)
      return { tile, point: feature.point, rotation: feature.rotation, transform: feature.transform }
    },

    transformPosition (pos) {
      return `translate(${this.getX(pos)} ${this.getY(pos)})`
    },

    transformRotation (rot) {
      return `rotate(${rot} 500 500)`
    },

    transformPoint (ptr) { // ptr is { position, location }
      const { tile, point, rotation, transform } = this.getTilePoint(ptr)
      return `${this.transformPosition(tile.position)} ${this.transformRotation(rotation)} ${transform || ''} translate(${point[0]} ${point[1]}) rotate(${-rotation} 0 0)`
    },

    transformTunnelEnd (ptr) {
      const { position, location } = ptr
      let rotation = 0
      if (location === 'E') rotation = 90
      if (location === 'S') rotation = 180
      if (location === 'W') rotation = 270
      const tile = this.tileOn(position)
      let y = 300
      if (!tile.id.startsWith('TU/')) {
        if (tile.id === 'AM/CRcr+' && Location.parse(location).rotateCCW(tile.rotation).name === 'N') {
          y = 400
        } else {
          y = 60
        }
      }
      return `${this.transformPosition(tile.position)} ${this.transformRotation(rotation)} translate(500 ${y}) rotate(${-rotation} 0 0)`
    }
  }
}
