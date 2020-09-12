<template>
  <div
    :class="{
      'quantity-buttons': true,
      'at-max': !canAdd,
      'switch': hasBooleanInterface,
      'mutable': mutable,
      'read-only': !mutable,
      'selected': value > 0}"
    @click.stop="onComponentClick"
  >
    <template v-if="value">
      <span v-if="mutable" class="remove" @click.stop="removeOne">
        <v-icon>fas fa-minus</v-icon>
      </span>
      <span class="count" @click.stop="removeAll">
        <v-icon v-if="value === 1 || value === true">fas fa-check</v-icon>
        <template v-else>{{ value }}</template>
      </span>
      <span v-if="mutable" class="add" title="Add multiple instances" @click.stop="add">
        <v-icon>fas fa-plus</v-icon>
      </span>
    </template>
    <template v-else>
      <div class="add-first" @click.stop="add">Add</div>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: [Number, Boolean], required: true },
    max: { type: Number, required: true },
    mutable: { type: Boolean, default: true }
  },

  computed: {
    isBoolean () {
      return this.value === false || this.value === true
    },

    hasBooleanInterface () {
      return this.isBoolean || this.max === 1
    },

    canAdd () {
      if (this.isBoolean) {
        return this.value === false
      } else {
        return this.value < this.max
      }
    }
  },

  methods: {
    add () {
      if (this.mutable && this.canAdd) {
        this.$emit('input', this.isBoolean ? true : this.value + 1)
      }
    },

    removeAll () {
      if (this.mutable && this.value) {
        this.$emit('input', this.isBoolean ? false : 0)
      }
    },

    removeOne () {
      if (this.mutable && this.value > 0) {
        this.$emit('input', this.isBoolean ? false : this.value - 1)
      }
    },

    onComponentClick () {
      // for on/off widget make whole area clickable
      if (this.mutable && this.hasBooleanInterface && this.value) {
        this.removeAll()
      }
    }
  }
}
</script>

<style lang="sass" scoped>
.quantity-buttons
  height: 56px
  display: flex
  align-items: stretch

// .quantity-buttons.mutable:hover
//   background: #EFEBE9

.add-first, .remove, .count, .add
  display: flex
  align-items: center
  justify-content: center
  cursor: pointer

.quantity-buttons.read-only .count
  cursor: default

.count
  font-size: 24px
  font-weight: 500
  color: $selection-icon

  i
    color: $selection-icon

.add-first
  flex: 1
  font-size: 16px
  text-transform: uppercase
  font-weight: 300
  color: #777

  &:hover
    color: $selection-hover
    text-decoration: underline

.remove, .count, .add
  flex: 1

.remove, .add
  visibility: hidden

  i
    color: $selection-icon

  &:hover i
    color: $selection-hover

.quantity-buttons:hover
  .remove, .add
    visibility: visible

.quantity-buttons.at-max
  .add
    visibility: hidden

.quantity-buttons.switch
  cursor: pointer

  .remove
    visibility: hidden
</style>