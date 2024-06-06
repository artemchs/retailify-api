import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ async: false })
class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: string) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/ // Basic international phone number regex
    return phoneRegex.test(phoneNumber)
  }

  defaultMessage() {
    return 'Phone number ($value) is not valid!'
  }
}

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneNumberConstraint,
    })
  }
}
