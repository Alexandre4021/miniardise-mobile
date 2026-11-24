<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Catalog;

/**
 * Normalise la fiche éditoriale du thème « MiniarDise Or » (mo_sheet_get) pour l'app.
 * Mêmes données, mêmes règles d'affichage que le site ; aucune réécriture du contenu.
 */
final class ProductSheet {
	public const PORTION_RATIO = 0.3; // portion de 30 g, comme sur le site

	public const NUTRI_ROWS = array(
		'energy' => array( 'Énergie', false ),
		'fat'    => array( 'Matières grasses', false ),
		'sat'    => array( 'dont acides gras saturés', true ),
		'carb'   => array( 'Glucides', false ),
		'sugar'  => array( 'dont sucres', true ),
		'fibre'  => array( 'Fibres alimentaires', false ),
		'prot'   => array( 'Protéines', false ),
		'salt'   => array( 'Sel', false ),
	);

	public const BENEFITS_NOTE = 'À intégrer dans une alimentation variée et équilibrée et un mode de vie sain. Les fruits à coque sont énergétiques : une poignée (environ 30 g) par jour suffit.';

	/**
	 * @param array<string, mixed> $s       Fiche brute du thème.
	 * @param string[]             $formats Libellés des poids disponibles.
	 * @param callable             $cell    fn(array $n, string $key, float $ratio): string (mo_nutri_cell du thème).
	 * @return array<string, mixed>
	 */
	public static function normalize( array $s, array $formats, callable $cell, string $fallbackHtml = '' ): array {
		$details = array();
		foreach ( (array) ( $s['details'] ?? array() ) as $row ) {
			[ $label, $value ] = array_pad( array_values( (array) $row ), 2, '' );
			if ( '' !== trim( (string) $label . (string) $value ) ) {
				$details[] = array( 'label' => (string) $label, 'value' => (string) $value );
			}
		}
		if ( $formats ) {
			$details[] = array( 'label' => 'Formats disponibles', 'value' => implode( ', ', $formats ) );
		}

		$recipes = array();
		foreach ( (array) ( $s['recipes'] ?? array() ) as $r ) {
			[ $title, $body ] = array_pad( array_values( (array) $r ), 2, '' );
			if ( '' !== trim( (string) $title . (string) $body ) ) {
				$recipes[] = array( 'title' => (string) $title, 'body' => (string) $body );
			}
		}

		$n      = (array) ( $s['nutrition'] ?? array() );
		$hasNut = isset( $n['kj'] ) || isset( $n['kcal'] ) || isset( $n['fat'] ) || isset( $n['prot'] );
		$rows   = array();
		if ( $hasNut ) {
			foreach ( self::NUTRI_ROWS as $key => [ $label, $sub ] ) {
				if ( 'fibre' === $key && ! isset( $n['fibre'] ) ) {
					continue; // mention facultative, masquée si non communiquée (comme le site)
				}
				$rows[] = array(
					'key'         => $key,
					'label'       => $label,
					'sub'         => $sub,
					'per_100g'    => (string) $cell( $n, $key, 1.0 ),
					'per_portion' => (string) $cell( $n, $key, self::PORTION_RATIO ),
				);
			}
		}

		$benefitsTitle = (string) ( $s['benefits_title'] ?? '' );
		$benefits      = array_values( array_filter( array_map( 'strval', (array) ( $s['benefits'] ?? array() ) ) ) );
		$text          = trim( (string) ( $s['text'] ?? '' ) );
		$lead          = trim( (string) ( $s['lead'] ?? '' ) );

		return array(
			'lead'           => $lead,
			'text'           => ( '' !== $text || '' !== $lead ) ? self::plain( $text ) : self::plain( $fallbackHtml ),
			'benefits_title' => '' !== $benefitsTitle ? $benefitsTitle : 'Bienfaits sur la santé',
			'benefits'       => $benefits,
			'benefits_note'  => ( $benefits && '' === $benefitsTitle ) ? self::BENEFITS_NOTE : '',
			'recipes'        => $recipes,
			'details'        => $details,
			'nutrition'      => $hasNut ? array(
				'rows' => $rows,
				'note' => self::nutritionNote( (string) ( $n['source'] ?? '' ), (string) ( $n['note'] ?? '' ) ),
			) : null,
			'storage'        => array_values( array_filter( array_map( 'strval', (array) ( $s['storage'] ?? array() ) ) ) ),
			'recycling'      => array_values( array_filter( array_map( 'strval', (array) ( $s['recycling'] ?? array() ) ) ) ),
		);
	}

	public static function nutritionNote( string $source, string $note ): string {
		$src    = array(
			'fournisseur' => 'Valeurs nutritionnelles moyennes communiquées par le fournisseur.',
			'ciqual'      => 'Valeurs moyennes de référence.',
			'reference'   => 'Valeurs moyennes de référence.',
		);
		$note   = trim( $note );
		$prefix = ( '' !== $note && in_array( $source, array( 'ciqual', 'reference' ), true ) ) ? '' : ( $src[ $source ] ?? '' );
		return trim( $prefix . ' ' . $note );
	}

	/** HTML WordPress → texte en paragraphes (l'app n'affiche jamais de HTML distant). */
	public static function plain( string $html ): string {
		$html  = preg_replace( '#<\s*(script|style)[^>]*>.*?<\s*/\s*\1\s*>#is', '', $html ) ?? '';
		$html  = preg_replace( '#<\s*br\s*/?>|<\s*/\s*(p|div|li|h[1-6])\s*>#i', "\n\n", $html ) ?? '';
		$text  = html_entity_decode( strip_tags( str_replace( "\r", '', $html ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$paras = preg_split( "/\n{2,}/", $text ) ?: array();
		$paras = array_filter( array_map( static fn( $p ) => trim( preg_replace( '/[\s\x{00A0}]+/u', ' ', $p ) ?? '' ), $paras ) );
		return implode( "\n\n", $paras );
	}
}
