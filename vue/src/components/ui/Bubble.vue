<template>
  <div ref="bubble"
       class="bubble"
       :class="'bubble--' + size"
       :style="{ '--bubble-color': color }"
       @mousedown.stop="() => handleMouseDown()">
    <div class="bubble__highlight"></div>
  </div>
</template>

<script>

export default {
  name: "Bubble",
  emits: ['expired', 'pop'],
  data() {
    return {
      isFlying: false,
      startTime: 0,
      x: this.initialX,
      y: this.initialY,
    }
  },
  props: {
    bubbleId: {
      type: Number,
      required: true
    },
    color: {
      default: '#6ea6df',
      type: String,
    },
    size: {
      default: 'medium',
      type: String,
    },
    amplitude: {
      type: Number,
      default: 30,
    },
    offset: {
      type: Number,
      default: 0
    },
    initialX: {
      type: Number,
      default: 0
    },
    initialY: {
      type: Number,
      default: 0
    },
  },
  methods: {
    handleMouseDown() {
      this.$emit('pop', {
        id: this.bubbleId,
        x: this.x,
        y: this.y,
        size: this.size,
        color: this.color
      })
    },
    startFlight() {
      this.isFlying = true
      this.startTime = performance.now()
      requestAnimationFrame((timestamp) => {
        this.animate(timestamp)
      })
    },
    animate(currentTime) {
      if (!this.isFlying || !this.$refs.bubble) return

      const elapsedTime = (currentTime - this.startTime) * 0.001
      this.y += 1.0
      this.x += Math.sin(elapsedTime + this.offset) * this.amplitude * 0.02

      this.$refs.bubble.style.transform = `translate(${this.x}px, ${this.y}px)`

      const bubbleRect = this.$refs.bubble.getBoundingClientRect()

      if (bubbleRect.top < window.innerHeight) {
        requestAnimationFrame((timestamp) => this.animate(timestamp))
      } else {
        this.isFlying = false
        this.$emit('expired', this.bubbleId)
      }
    },
    push(explosionX, explosionY, sourceSize) {
      const sizeDistances = {
        big: {big: 1, medium: 1.5, small: 2},
        medium: {big: 0.5, medium: 1, small: 1.5},
        small: {big: 0.25, medium: 0.5, small: 1}
      }
      const sourceRadius = {big: 37.5, medium: 20, small: 12.5}
      const baseRadius = sourceRadius[sourceSize]

      const deltaX = this.x - explosionX
      const deltaY = this.y - explosionY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > 200 || distance === 0) return

      const shift = baseRadius * sizeDistances[sourceSize][this.size]

      const shiftX = (deltaX / distance) * shift
      const shiftY = (deltaY / distance) * shift

      this.x += shiftX
      this.y += shiftY
    },
  },
  mounted() {
    this.$refs.bubble.style.transform = `translate(${this.initialX}px, ${this.initialY}px)`
    this.$nextTick(() => {
      this.startFlight()
    })
  },
}
</script>

<style lang="scss">
.bubble {
  position: absolute;
  border: 1px solid var(--bubble-color);
  background: color-mix(in srgb, var(--bubble-color), transparent 50%);
  border-radius: 50%;
  width: 40px;
  height: 40px;

  &--small {
    width: 25px;
    height: 25px;
  }

  &--medium {
    width: 40px;
    height: 40px;
  }

  &--big {
    width: 75px;
    height: 75px;
  }

  &__highlight {
    position: absolute;
    top: 15%;
    left: 15%;
    width: 30%;
    height: 30%;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    filter: blur(2px);
  }
}
</style>
